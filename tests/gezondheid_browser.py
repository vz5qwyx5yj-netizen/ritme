"""Integration checks for the app split. Uses installed Google Chrome and Playwright."""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = Path('/private/tmp/gezondheid-checks')
ARTIFACTS.mkdir(exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def add_habit(page, name):
    page.locator('#habit-add').click()
    page.locator('#habit-name').fill(name)
    page.locator('#habit-form button[type=submit]').click()


def import_backup(page, data):
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('#fileImport').set_input_files({
        'name': 'backup.json', 'mimeType': 'application/json',
        'buffer': json.dumps(data).encode(),
    })


def test_apps(browser, url, errors):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True,
                                  has_touch=True, service_workers='block')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)
    today = page.evaluate('TODAY')
    yesterday = page.evaluate('addDays(TODAY,-1)')
    old = {'entries': {today: {'slaap': 8, 'groente': 5, 'fruit': 2, 'sport': 35, 'dienst': 'nacht', 'workouts': ['old-workout']},
                       yesterday: {'slaap': 7, 'groente': 5, 'fruit': 2, 'sport': 30, 'dienst': 'vrij'}}}
    page.evaluate('(data)=>localStorage.setItem("ritme.v1",JSON.stringify(data))', old)
    page.reload()
    expect(page.locator('#val-sport')).to_have_text('35 min')
    expect(page.locator('#progPct')).to_have_text('100% voltooid')
    assert page.locator('#tab-workout').count() == 0
    assert page.locator('#workout-root').count() == 0
    expect(page.locator('#open-workout')).to_have_attribute('href', 'Workout/')
    add_habit(page, 'Elke dag lezen')
    expect(page.locator('#progPct')).to_have_text('80% voltooid')
    check = page.get_by_role('checkbox', name='Elke dag lezen')
    check.check()
    expect(page.locator('#progPct')).to_have_text('100% voltooid')
    habit_id = check.get_attribute('data-habit')
    page.reload()
    expect(check).to_be_checked()
    state = page.evaluate('JSON.parse(localStorage.getItem("ritme.v1"))')
    assert state['entries'][today]['workouts'] == ['old-workout']
    assert state['entries'][today]['sport'] == 35
    page.locator('#prevDay').click()
    assert page.get_by_role('checkbox').count() == 0
    expect(page.locator('#progPct')).to_have_text('100% voltooid')
    page.locator('#nextDay').click()
    expect(check).to_be_checked()
    check.uncheck()
    expect(page.locator('#progPct')).to_have_text('80% voltooid')
    check.check()

    # Duplicate names do not create a second habit; user text stays literal.
    page.locator('#habit-add').click()
    page.locator('#habit-name').fill(' ELKE DAG LEZEN ')
    page.locator('#habit-form button[type=submit]').click()
    assert page.locator('#habit-name').evaluate('(input)=>input.validationMessage') == 'Deze gewoonte bestaat al.'
    assert page.get_by_role('checkbox').count() == 1
    page.locator('#habit-cancel').click()
    hostile_name = '<img src=x onerror=alert(1)>'
    add_habit(page, hostile_name)
    assert page.locator('#habit-list img').count() == 0
    expect(page.locator('#habit-list')).to_contain_text(hostile_name)
    page.screenshot(path=str(ARTIFACTS / 'ritme-vandaag.png'), full_page=True)
    page.locator('#tab-overzicht').click()
    expect(page.locator('#habit-overview')).to_contain_text('Elke dag lezen')
    expect(page.locator('#habit-overview')).to_contain_text('1 / 1 dagen')
    expect(page.locator('#shiftBreak')).to_contain_text('Nacht')
    assert page.locator('svg.chart').count() == 3
    page.screenshot(path=str(ARTIFACTS / 'ritme-overzicht.png'), full_page=True)

    # Export contains definitions and checks; restore to a fresh installation.
    page.evaluate('Object.defineProperty(navigator,"canShare",{value:undefined,configurable:true})')
    with page.expect_download() as download:
        page.locator('#btnExport').click()
    exported = json.loads(Path(download.value.path()).read_text())
    assert exported['entries'][today]['habits'][habit_id] is True
    assert len(exported['habits']) == 2
    page.evaluate('localStorage.removeItem("ritme.v1")')
    page.reload()
    import_backup(page, exported)
    expect(page.get_by_role('checkbox', name='Elke dag lezen')).to_be_checked()
    expect(page.locator('#val-sport')).to_have_text('35 min')

    # An old backup merges without deleting the new habit definitions.
    import_backup(page, {'entries': {yesterday: {'slaap': 8, 'sport': 45, 'dienst': 'ochtend'}}})
    page.locator('#prevDay').click()
    expect(page.locator('#val-sport')).to_have_text('45 min')
    page.locator('#nextDay').click()
    expect(page.get_by_role('checkbox', name='Elke dag lezen')).to_be_checked()
    tracker_before = page.evaluate('localStorage.getItem("ritme.v1")')

    # Separate app: animated previews, both exact durations, pause/reload, no writes to Ritme.
    page.locator('#open-workout').click()
    expect(page).to_have_title('Workout')
    assert page.locator('[data-preview]').count() == 5
    page.screenshot(path=str(ARTIFACTS / 'workout-menu.png'), full_page=True)
    page.locator('[data-preview="pullup"]').click()
    expect(page.locator('dialog[open]')).to_contain_text('voeten vrij')
    assert page.locator('dialog[open] .wk-animate').count() == 1
    page.locator('[data-preview-motion]').click()
    assert page.locator('dialog[open] .wk-animate').count() == 0
    page.locator('[data-close]').click()
    page.clock.install()
    page.locator('[data-action="start"]').click()
    expect(page.locator('#wk-clock')).to_have_text('0:30')
    page.clock.run_for(10000)
    expect(page.locator('#wk-clock')).to_have_text('0:20')
    page.locator('[data-action="pause"]').click()
    page.clock.run_for(60000)
    expect(page.locator('#wk-clock')).to_have_text('0:20')
    page.locator('[data-action="pause"]').click()
    page.clock.run_for(70000)
    expect(page.locator('.wk-player-body h2')).to_have_text('Optrekken aan de trap')
    page.reload()
    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
    expect(page.locator('.wk-player-body h2')).to_have_text('Optrekken aan de trap')
    page.clock.install()
    page.locator('[data-action="pause"]').click()
    page.clock.run_for(220000)
    expect(page.locator('.wk-complete')).to_be_visible()
    assert page.locator('[data-action="log"]').count() == 0
    assert page.evaluate('localStorage.getItem("ritme.v1")') == tracker_before
    page.reload()
    expect(page.locator('.wk-complete')).to_be_visible()
    page.screenshot(path=str(ARTIFACTS / 'workout-klaar.png'), full_page=True)
    page.locator('[data-action="new"]').click()
    page.locator('[data-minutes="10"]').click()
    page.clock.install()
    page.locator('[data-action="start"]').click()
    expect(page.locator('#wk-total')).to_have_text('10:00 over')
    page.clock.run_for(310000)
    expect(page.locator('#wk-stage-tag')).to_have_text('Ronde 2 van 2')
    page.clock.run_for(289000)
    expect(page.locator('#wk-clock')).to_have_text('0:01')
    page.clock.run_for(1000)
    expect(page.locator('.wk-complete')).to_be_visible()
    assert page.evaluate('localStorage.getItem("ritme.v1")') == tracker_before
    page.locator('[data-action="new"]').click()
    page.locator('[data-action="start"]').click()
    page.locator('[data-action="stop"]').click()
    page.locator('[data-continue]').click()
    expect(page.locator('[data-action="pause"]')).to_contain_text('Pauzeren')
    page.locator('[data-action="stop"]').click()
    page.locator('[data-stop-confirm]').click()
    assert page.evaluate('localStorage.getItem("workout.session.v1")') is None
    page.locator('[data-action="start"]').click()
    page.clock.fast_forward(60000)
    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
    expect(page.locator('#wk-clock')).to_have_text('1:00')
    page.locator('[data-action="stop"]').click()
    page.locator('[data-stop-confirm]').click()

    page.emulate_media(color_scheme='dark', reduced_motion='reduce')
    page.locator('[data-preview="handstand"]').click()
    assert page.locator('dialog[open] .wk-animate').count() == 0
    page.locator('[data-preview-motion]').click()
    assert page.locator('dialog[open] .wk-motion-requested').count() == 1
    page.locator('[data-close]').click()
    for path in ['Workout/', '']:
        page.goto(url + path)
        for width in [320, 768, 1280]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (path, width)
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(ARTIFACTS / 'ritme-donker.png'), full_page=True)

    # A backup containing only habit definitions is also useful and restorable.
    page.evaluate('localStorage.removeItem("ritme.v1")')
    page.reload()
    import_backup(page, {'entries': {}, 'habits': [{'id': 'h-backup-only', 'name': 'Wandelen', 'startDate': today}]})
    expect(page.get_by_role('checkbox', name='Wandelen')).to_be_visible()
    # Local storage failure must not leave a phantom habit in memory or UI.
    page.evaluate('()=>{Storage.prototype.setItem=()=>{throw new Error("quota")};}')
    add_habit(page, 'Niet opgeslagen')
    expect(page.locator('#toast')).to_contain_text('Opslaan lukt niet')
    assert page.get_by_role('checkbox').count() == 1
    context.close()


def test_stability(browser, url, errors):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url + 'Workout/')
    # Existing sessions from before routine selection keep the original sequence.
    legacy = {'id': 'before-routines', 'minutes': 5, 'index': 3, 'elapsed': 7, 'status': 'running'}
    page.evaluate('(s)=>localStorage.setItem("workout.session.v1",JSON.stringify(s))', legacy)
    page.reload()
    expect(page.locator('.wk-player-body h2')).to_have_text('Optrekken aan de trap')
    expect(page.locator('#wk-clock')).to_have_text('0:23')
    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
    page.locator('[data-action="stop"]').click()
    page.locator('[data-stop-confirm]').click()
    page.locator('[data-routine="stability"]').click()
    expect(page.locator('[data-routine="stability"]')).to_have_attribute('aria-pressed', 'true')
    assert page.locator('[data-preview]').count() == 4
    for exercise, name in [('plank', 'Plank'), ('side-plank', 'Side plank'), ('bridge', 'The Bridge'), ('bird-dog', 'Bird Dogs')]:
        page.locator(f'[data-preview="{exercise}"]').click()
        expect(page.locator('#wk-preview-title')).to_have_text(name)
        assert page.locator('dialog[open] .wk-animate').count() == (0 if exercise == 'bird-dog' else 1)
        assert page.evaluate('(id)=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth>=1024&&img.naturalHeight>=1024);img.onerror=()=>resolve(false);img.src="assets/workout/"+id+".png"})', 'bird-dog-pose' if exercise == 'bird-dog' else exercise)
        if exercise == 'side-plank':
            expect(page.locator('dialog[open]')).to_contain_text('30 sec per kant')
        if exercise == 'bird-dog':
            expect(page.locator('dialog[open]')).to_contain_text('rechterarm naar voren en je linkerbeen')
        page.locator('[data-close]').click()
    page.screenshot(path=str(ARTIFACTS / 'core-stabiliteit-menu.png'), full_page=True)
    for minutes in [5, 10]:
        page.locator(f'[data-minutes="{minutes}"]').click()
        page.clock.install()
        page.locator('[data-action="start"]').click()
        expect(page.locator('#wk-total')).to_have_text(f'{minutes}:00 over')
        page.clock.run_for((30 if minutes == 5 else 60) * 1000)
        for round_number in range(1, (2 if minutes == 10 else 1) + 1):
            for title in ['Plank', 'Side plank · links', 'Side plank · rechts', 'The Bridge', 'Bird Dogs']:
                expect(page.locator('.wk-player-body h2')).to_have_text(title)
                expect(page.locator('#wk-stage-tag')).to_have_text(f'Ronde {round_number} van {2 if minutes == 10 else 1}')
                expect(page.locator('#wk-clock')).to_have_text('0:30')
                if title == 'Side plank · links':
                    expect(page.locator('.wk-instruction')).to_contain_text('linkeronderarm')
                if title == 'Side plank · rechts':
                    expect(page.locator('.wk-instruction')).to_contain_text('rechteronderarm')
                if minutes == 5 and title == 'The Bridge':
                    page.locator('[data-action="pause"]').click()
                    page.reload()
                    expect(page.locator('.wk-player-body h2')).to_have_text('The Bridge')
                    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
                    assert page.evaluate('JSON.parse(localStorage.getItem("workout.session.v1")).routine') == 'stability'
                    page.clock.install()
                    page.locator('[data-action="pause"]').click()
                page.clock.run_for(30000)
                expect(page.locator('#wk-stage-tag')).to_have_text('Rustmoment')
                page.clock.run_for(20000)
        expect(page.locator('.wk-player-body h2')).to_have_text('Rustig afronden')
        page.clock.run_for((20 if minutes == 5 else 40) * 1000 - 1000)
        expect(page.locator('#wk-clock')).to_have_text('0:01')
        page.clock.run_for(1000)
        expect(page.locator('.wk-complete')).to_contain_text('Core stabiliteit afgerond')
        expect(page.locator('.wk-complete')).to_contain_text('4 oefeningen')
        expect(page.locator('.wk-complete')).to_contain_text('Side plank aan beide kanten')
        assert page.evaluate('localStorage.getItem("ritme.v1")') is None
        page.reload()
        expect(page.locator('.wk-complete')).to_be_visible()
        page.locator('[data-action="new"]').click()
        expect(page.locator('[data-routine="stability"]')).to_have_attribute('aria-pressed', 'true')
    page.emulate_media(color_scheme='dark', reduced_motion='reduce')
    for width in [320, 768, 1280]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.locator('[data-preview="plank"]').click()
    assert page.locator('dialog[open] .wk-animate').count() == 0
    page.locator('[data-preview-motion]').click()
    assert page.locator('dialog[open] .wk-motion-requested').count() == 1
    page.locator('[data-close]').click()
    # Invalid routine IDs must not break the player or start an unintended plan.
    page.evaluate('(s)=>localStorage.setItem("workout.session.v1",JSON.stringify({...s,routine:"unknown"}))', legacy)
    page.reload()
    expect(page.locator('[data-action="start"]')).to_be_visible()
    expect(page.locator('[data-routine="classic"]')).to_have_attribute('aria-pressed', 'true')
    context.close()


def test_offline(browser, url, errors):
    context = browser.new_context(viewport={'width': 390, 'height': 844})
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)
    page.evaluate('navigator.serviceWorker.ready')
    page.reload()
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    add_habit(page, 'Offline lezen')
    page.get_by_role('checkbox', name='Offline lezen').check()
    page.locator('#open-workout').click()
    page.wait_for_function('navigator.serviceWorker.controller?.scriptURL.endsWith("/Workout/sw.js")')
    page.evaluate('navigator.serviceWorker.ready')
    page.reload()
    page.wait_for_function('navigator.serviceWorker.controller?.scriptURL.endsWith("/Workout/sw.js")')
    keys = page.evaluate('caches.keys()')
    assert len([key for key in keys if key.startswith('ritme-')]) == 1, keys
    assert len([key for key in keys if key.startswith('workout-')]) == 1, keys
    regs = page.evaluate('navigator.serviceWorker.getRegistrations().then(regs=>regs.map(reg=>reg.scope))')
    assert len(regs) == 2, regs
    context.set_offline(True)
    page.reload()
    expect(page).to_have_title('Workout')
    page.locator('[data-routine="stability"]').click()
    for exercise in ['plank', 'side-plank', 'bridge', 'bird-dog-pose']:
        assert page.evaluate('(id)=>fetch("assets/workout/"+id+".png").then(r=>r.ok)', exercise)
    page.locator('[data-action="start"]').click()
    expect(page.locator('#wk-clock')).to_be_visible()
    assert page.evaluate('fetch("assets/workout/handstand.png").then(r=>r.ok)')
    page.goto(url)
    expect(page).to_have_title('Ritme')
    expect(page.get_by_role('checkbox', name='Offline lezen')).to_be_checked()
    page.get_by_role('checkbox', name='Offline lezen').uncheck()
    page.reload()
    expect(page.get_by_role('checkbox', name='Offline lezen')).not_to_be_checked()
    page.locator('#open-workout').click()
    expect(page).to_have_title('Workout')
    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
    context.close()


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/'
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
            print("Registraties, gewoontes en workouts controleren...", flush=True)
            test_apps(browser, url, errors)
            print("Registraties, gewoontes en workouts: PASS", flush=True)
            test_stability(browser, url, errors)
            print("Nieuwe oefeningen, beide kanten en beide sessieduren: PASS", flush=True)
            test_offline(browser, url, errors)
            print("Afzonderlijke offline apps: PASS", flush=True)
            # Installation identities and scopes must differ, keeping Ritme's old start URL.
            page = browser.new_page()
            page.goto(url)
            manifests = page.evaluate('Promise.all(["manifest.json","Workout/manifest.json"].map(path=>fetch(path).then(r=>r.json())))')
            assert manifests[0]['name'] == 'Ritme' and manifests[0]['start_url'] == './index.html'
            assert manifests[1]['name'] == 'Workout' and manifests[1]['scope'] == './'
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print(json.dumps({'result': 'PASS', 'screenshots': str(ARTIFACTS), 'browser_errors': errors}))


if __name__ == '__main__':
    main()

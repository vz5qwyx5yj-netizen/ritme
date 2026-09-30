"""Workout browser checks: legacy core sessions, padel timers, illustrations and offline use."""
import json
import threading
from functools import partial
from http.server import ThreadingHTTPServer
from playwright.sync_api import sync_playwright, expect
from gezondheid_browser import ROOT, ARTIFACTS, Handler, test_stability

ROUTINES = {
    'padel-strength': {
        'name': 'Padel kracht', 'seconds': 600, 'rest': 20,
        'exercises': ['squat', 'reverse-lunge', 'side-lunge', 'bridge', 'calf-raise', 'push-up', 'taps', 'skater'],
        'blocks': [('Squat', None), ('Reverse lunge', 'voet'), ('Side lunge', 'been'),
                   ('Glute bridge', None), ('Single-leg calf raise', 'been'), ('Push-up', None),
                   ('Plank shoulder taps', None), ('Skater jumps', None)],
    },
    'padel-stretch': {
        'name': 'Padel stretch', 'seconds': 610, 'rest': 10,
        'exercises': ['hip-flexor', 'adductor', 'hip-9090', 'ankle', 'calf-stretch', 'open-book', 'chest-stretch', 'lat-stretch'],
        'blocks': [('Heupflexor stretch', 'knie'), ('Adductor rock-back', 'been'), ('90/90 heupstretch', None),
                   ('Enkelmobiliteit', 'voet'), ('Kuitstretch', 'been'), ('Open book rotatie', 'arm'),
                   ('Schouder/borststretch', 'onderarm'), ('Lat stretch', None)],
    },
}


def clock_text(seconds):
    return f'{seconds // 60}:{seconds % 60:02}'


def assert_image(page, selector):
    assert page.locator(selector).evaluate('''async el => {
        const url = getComputedStyle(el).backgroundImage.slice(5, -2);
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img.naturalWidth >= 1024 && img.naturalHeight >= 1024);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }''')


def stop(page):
    page.locator('[data-action="stop"]').click()
    page.locator('[data-stop-confirm]').click()


def test_classic(browser, url, errors):
    context = browser.new_context(service_workers='block')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url + 'Workout/')
    for minutes in [5, 10]:
        page.locator(f'[data-minutes="{minutes}"]').click()
        page.locator('[data-preview="taps"]').click()
        assert page.locator('dialog[open] .wk-animate').count() == 1
        page.locator('[data-close]').click()
        page.clock.install()
        page.locator('[data-action="start"]').click()
        expect(page.locator('#wk-total')).to_have_text(f'{minutes}:00 over')
        page.clock.run_for((minutes * 60 - 1) * 1000)
        expect(page.locator('#wk-clock')).to_have_text('0:01')
        page.clock.run_for(1000)
        expect(page.locator('.wk-complete')).to_contain_text('Core kracht afgerond')
        page.locator('[data-action="new"]').click()
    context.close()


def test_padel(browser, url, errors):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url + 'Workout/')
    assert page.locator('[data-routine]').count() == 4
    for routine_id, routine in ROUTINES.items():
        page.locator(f'[data-routine="{routine_id}"]').click()
        expect(page.locator('[data-rounds="1"]')).to_have_attribute('aria-pressed', 'true')
        assert page.locator('[data-preview]').evaluate_all('(els)=>els.map(el=>el.dataset.preview)') == routine['exercises']
        for exercise in routine['exercises']:
            page.locator(f'[data-preview="{exercise}"]').click()
            assert page.locator('dialog[open] .wk-still').count() == 1
            assert page.locator('[data-preview-motion], dialog[open] .wk-animate').count() == 0
            assert page.locator('dialog[open] ol li').count() == 3
            expect(page.locator('dialog[open] .wk-tip')).to_be_visible()
            expect(page.locator('dialog[open]')).not_to_contain_text('rechterarm met linkerbeen')
            assert_image(page, 'dialog[open] .wk-sprite')
            page.locator('[data-close]').click()
        for width in [320, 768, 1280]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(ARTIFACTS / f'{routine_id}-{width}.png'), full_page=True)
        page.set_viewport_size({'width': 390, 'height': 844})
        for rounds in [1, 2]:
            page.locator(f'[data-rounds="{rounds}"]').click()
            page.clock.install()
            page.locator('[data-action="start"]').click()
            total = routine['seconds'] * rounds
            expect(page.locator('#wk-total')).to_have_text(f'{clock_text(total)} over')
            expect(page.locator('[role="progressbar"]')).to_have_attribute('aria-valuenow', '0')
            page.clock.run_for(30 * rounds * 1000)
            elapsed = 30 * rounds
            for round_number in range(1, rounds + 1):
                for title, body_part in routine['blocks']:
                    for side in ['links', 'rechts'] if body_part else [None]:
                        expected_title = title + (f' · {side}' if side else '')
                        expect(page.locator('.wk-player-body h2')).to_have_text(expected_title)
                        expect(page.locator('#wk-stage-tag')).to_have_text(f'Ronde {round_number} van {rounds}')
                        expect(page.locator('#wk-clock')).to_have_text('0:30')
                        assert page.locator('#workout-root .wk-scene .wk-still').count() == 1, expected_title
                        assert page.locator('[data-action="motion"], .wk-animate').count() == 0
                        if side:
                            expect(page.locator('.wk-instruction')).to_contain_text(('linker' if side == 'links' else 'rechter') + body_part)
                        if elapsed == 30 * rounds:
                            # Keep a partially completed stage, routine and round count across reload.
                            page.clock.run_for(7000)
                            page.locator('[data-action="pause"]').click()
                            page.clock.run_for(60000)
                            expect(page.locator('#wk-clock')).to_have_text('0:23')
                            page.reload()
                            expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
                            expect(page.locator('#wk-clock')).to_have_text('0:23')
                            state = page.evaluate('JSON.parse(localStorage.getItem("workout.session.v1"))')
                            assert state['routine'] == routine_id and state['rounds'] == rounds
                            page.clock.install()
                            page.locator('[data-action="pause"]').click()
                            page.clock.run_for(23000)
                        else:
                            page.clock.run_for(30000)
                        expect(page.locator('#wk-stage-tag')).to_have_text('Wisseltijd' if routine_id == 'padel-stretch' else 'Rustmoment')
                        expect(page.locator('#wk-clock')).to_have_text(clock_text(routine['rest']))
                        page.clock.run_for(routine['rest'] * 1000)
                        elapsed += 30 + routine['rest']
                        expect(page.locator('#wk-total')).to_have_text(f'{clock_text(total - elapsed)} over')
                        assert abs(int(page.locator('[role="progressbar"]').get_attribute('aria-valuenow')) - elapsed / total * 100) <= 0.51
            expect(page.locator('.wk-player-body h2')).to_have_text('Rustig afronden')
            page.clock.run_for((20 * rounds - 1) * 1000)
            expect(page.locator('#wk-clock')).to_have_text('0:01')
            page.clock.run_for(1000)
            expect(page.locator('.wk-complete')).to_contain_text(routine['name'] + ' afgerond')
            expect(page.locator('.wk-complete')).to_contain_text('8 oefeningen')
            expect(page.locator('.wk-complete')).not_to_contain_text('core')
            expect(page.locator('.wk-complete-stat')).to_contain_text(str(total // 60) if total % 60 == 0 else clock_text(total))
            page.reload()
            expect(page.locator('.wk-complete')).to_be_visible()
            page.locator('[data-action="new"]').click()
        page.locator('[data-action="start"]').click()
        page.locator('[data-action="stop"]').click()
        expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
        page.locator('[data-continue]').click()
        expect(page.locator('[data-action="pause"]')).to_contain_text('Pauzeren')
        stop(page)
        assert page.evaluate('localStorage.getItem("workout.session.v1")') is None
        page.emulate_media(reduced_motion='reduce')
        page.locator(f'[data-preview="{routine["exercises"][0]}"]').click()
        assert page.locator('dialog[open] .wk-animate, [data-preview-motion]').count() == 0
        page.locator('[data-close]').click()
    # Routine switching resets round selection; shared exercises remain animated in core.
    page.locator('[data-routine="stability"]').click()
    page.locator('[data-preview="bridge"]').click()
    expect(page.locator('#wk-preview-title')).to_have_text('The Bridge')
    assert page.locator('[data-preview-motion]').count() == 1
    page.locator('[data-close]').click()
    for rounds in [0, 3, '2', None]:
        state = {'id': 'bad-rounds', 'routine': 'padel-stretch', 'rounds': rounds,
                 'minutes': 10, 'index': 0, 'elapsed': 0, 'status': 'paused'}
        page.evaluate('(s)=>localStorage.setItem("workout.session.v1",JSON.stringify(s))', state)
        page.reload()
        expect(page.locator('[data-action="start"]')).to_be_visible()
    assert page.evaluate('localStorage.getItem("ritme.v3")') is None
    context.close()


def test_padel_offline(browser, url, errors):
    context = browser.new_context(viewport={'width': 390, 'height': 844})
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url + 'Workout/')
    page.evaluate('navigator.serviceWorker.ready')
    page.reload()
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    context.set_offline(True)
    page.reload()
    for routine_id, routine in ROUTINES.items():
        page.locator(f'[data-routine="{routine_id}"]').click()
        for exercise in routine['exercises']:
            page.locator(f'[data-preview="{exercise}"]').click()
            assert_image(page, 'dialog[open] .wk-sprite')
            page.locator('[data-close]').click()
        page.clock.install()
        page.locator('[data-action="start"]').click()
        page.clock.run_for(35000)
        page.reload()
        expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
        page.clock.install()
        page.locator('[data-action="pause"]').click()
        expect(page.locator('#wk-total')).to_have_text(f'{clock_text(routine["seconds"] - 35)} over')
        stop(page)
    context.close()


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
            url = f'http://127.0.0.1:{server.server_port}/'
            for test in [test_classic, test_stability, test_padel, test_padel_offline]:
                test(browser, url, errors)
                print(f'{test.__name__}: PASS', flush=True)
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print(json.dumps({'result': 'PASS', 'screenshots': str(ARTIFACTS), 'browser_errors': errors}))


if __name__ == '__main__':
    main()

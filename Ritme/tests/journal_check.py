"""Browser regression: PYTHONPATH=/tmp/ritme-test-deps python3 tests/journal_check.py"""
import datetime
import functools
import http.server
import json
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = str(Path(__file__).resolve().parents[1])
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=ROOT))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/index.html'
seed = {'habits': [{'id': 'h-read', 'name': 'Een boek lezen', 'startDate': '2024-01-01'}], 'entries': {
    '2026-09-27': {'slaap': 8, 'groente': 5, 'fruit': 2, 'sport': 30, 'dienst': 'vrij', 'habits': {'h-read': True}},
    '2026-09-26': {'habits': {'h-read': 'partial'}}}}
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    context = browser.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
    page = context.new_page()
    page.clock.install(time=datetime.datetime(2026, 9, 29, 12, tzinfo=datetime.timezone.utc))
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    page.evaluate('(v) => {localStorage.clear();localStorage.setItem("ritme.v1",JSON.stringify(v))}', seed)
    page.reload()
    state = lambda: page.evaluate('JSON.parse(localStorage.getItem("ritme.v2"))')
    migrated = state()
    assert migrated['entries'] == {} and migrated['startDate'] == '2026-09-29'
    assert json.loads(migrated['archives'][0]['raw']) == seed
    assert len(migrated['habits']) == 1
    page.reload()
    assert state() == migrated
    assert page.locator('.daily-row').count() == 5
    sleep = page.locator('.daily-row[data-habit="slaap"]')
    sleep.click()
    assert state()['entries']['2026-09-29']['checks']['slaap'] is True
    assert sleep.evaluate('(b)=>b===document.activeElement')
    page.keyboard.press('Space')
    assert state()['entries']['2026-09-29']['checks']['slaap'] is False
    sleep.click()
    page.locator('#shifts button').first.click()
    assert state()['entries']['2026-09-29']['dienst'] == 'ochtend'
    page.locator('[data-view="inzichten"]').click()
    assert page.locator('#progress-percent').inner_text() == '20%'
    # Save failure must not update visible or persisted checks.
    page.locator('[data-view="vandaag"]').click()
    page.evaluate('() => {window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error("quota")}}')
    sleep.click()
    assert sleep.get_attribute('aria-pressed') == 'true'
    assert state()['entries']['2026-09-29']['checks']['slaap'] is True
    assert 'Opslaan lukt niet' in page.locator('#toast').inner_text()
    page.evaluate('() => {Storage.prototype.setItem=window.originalSetItem}')
    page.locator('#add-habit').click()
    page.locator('#habit-name').fill('Naar buiten gaan')
    page.locator('#habit-form button[type="submit"]').click()
    assert state()['habits'][-1]['startDate'] == '2026-09-29'
    page.locator('[data-view="gewoontes"]').click()
    assert page.locator('.journal-table thead th').count() == 8
    assert page.locator('[data-date="2026-09-28"][data-habit="slaap"]').is_disabled()
    assert page.locator('[data-date="2026-09-30"][data-habit="slaap"]').is_disabled()
    page.locator('[data-date="2026-09-29"][data-habit="fruit"]').click()
    assert state()['entries']['2026-09-29']['checks']['fruit']
    page.locator('[data-mode="month"]').click()
    assert page.locator('.journal-table thead th').count() == 31
    for date, mode, count, first, last in [('2024-02-15','month',29,'2024-02-01','2024-02-29'),('2026-01-01','week',7,'2025-12-29','2026-01-04')]:
        dates = page.evaluate('([d,m])=>RitmeStore.periodDates(d,m)', [date,mode])
        assert (len(dates),dates[0],dates[-1]) == (count,first,last)
    result=page.evaluate('''() => RitmeStore.stats({startDate:'2026-09-28',habits:[{id:'h-new',name:'Nieuw',startDate:'2026-09-29'}],entries:{'2026-09-28':{checks:{slaap:true}},'2026-09-29':{checks:{'h-new':true}}}},RitmeStore.periodDates('2026-09-29','week'))''')
    assert result['total'] == 9 and result['done'] == 2 and result['percent'] == 22
    # Back-up round trip and archived legacy import.
    page.locator('[data-view="inzichten"]').click()
    with page.expect_download() as info: page.locator('#export').click()
    exported=json.loads(Path(info.value.path()).read_text())
    assert exported['entries']['2026-09-29']['checks']['fruit']
    page.on('dialog',lambda d:d.accept())
    def import_file(value):
        page.locator('#import-file').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(value).encode()})
    import_file(exported)
    page.wait_for_function('JSON.parse(localStorage.getItem("ritme.v2")).archives.length===2')
    assert state()['entries']==exported['entries']
    different={'entries':{'2020-01-01':{'slaap':6}},'habits':[]}
    import_file(different)
    page.wait_for_function('JSON.parse(localStorage.getItem("ritme.v2")).archives.length===3')
    assert state()['entries']==exported['entries']
    before=state()
    import_file({'version':2,'entries':{}})
    page.wait_for_function('document.getElementById("toast").textContent.includes("geldige Ritme")')
    assert state()==before
    page.clock.fast_forward(5000)
    # Visual layouts and light theme regardless of OS setting.
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':1000 if width>500 else 844})
        for view in ['vandaag','gewoontes','inzichten']:
            page.locator(f'[data-view="{view}"]').click()
            if view=='gewoontes': page.locator('[data-mode="week"]').click()
            page.evaluate('document.fonts.ready')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (width,view)
            page.screenshot(path=f'/tmp/ritme-paper-{view}-{width}.png',full_page=True)
        page.locator('[data-view="gewoontes"]').click()
        page.locator('[data-mode="month"]').click()
        before_x=page.locator('.journal-table tbody th').first.bounding_box()['x']
        page.evaluate('document.getElementById("habit-grid").scrollLeft=600')
        after_x=page.locator('.journal-table tbody th').first.bounding_box()['x']
        assert abs(before_x-after_x)<1
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.emulate_media(color_scheme='dark')
    assert page.evaluate('getComputedStyle(document.documentElement).colorScheme')=='light'
    # Offline shell, scripts, font and persistence.
    page.evaluate('navigator.serviceWorker.ready')
    page.wait_for_function('navigator.serviceWorker.controller!==null')
    context.set_offline(True)
    page.reload()
    assert page.locator('.daily-row').count()==6
    page.locator('.daily-row[data-habit="groente"]').click()
    assert state()['entries']['2026-09-29']['checks']['groente']
    page.evaluate('document.fonts.ready')
    assert page.evaluate('document.fonts.check("22px Journal")')
    context.set_offline(False)
    # Midnight advances the Today screen and eligibility.
    page.clock.fast_forward(24*60*60*1000)
    assert '30 september' in page.locator('#date-label').inner_text()
    assert page.locator('.daily-row[data-habit="slaap"]').get_attribute('aria-pressed')=='false'
    assert page.evaluate('JSON.parse(localStorage.getItem("ritme.v1"))')==seed
    assert not errors,errors
    browser.close()
server.shutdown()
print('PASS: migration, archive, binary checks, keyboard focus, shifts, failed saves, new habits, calendar, statistics, backup round trip, invalid import, responsive layouts, sticky month labels, light theme, offline and midnight rollover.')

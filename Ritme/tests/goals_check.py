"""Goal management browser regression. Uses Python Playwright and installed Chrome."""
import datetime, functools, http.server, json, os, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=os.environ.get('RITME_TEST_ROOT',str(Path(__file__).resolve().parents[1]))
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=ROOT))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
archive={'savedAt':'2026-09-28T10:00:00Z','raw':'{"old":"untouched"}'}
old={'version':2,'startDate':'2026-09-28','habits':[{'id':'h-custom','name':'Gitaar spelen','startDate':'2026-09-29'}], 'entries':{'2026-09-28':{'checks':{'slaap':True,'fruit':True},'dienst':'nacht'},'2026-09-29':{'checks':{'slaap':True,'h-custom':True},'dienst':'vrij'}},'archives':[archive]}
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.clock.install(time=datetime.datetime(2026,9,30,12,tzinfo=datetime.timezone.utc))
    page.goto(url)
    page.evaluate('(v)=>{localStorage.clear();localStorage.setItem("ritme.v2",JSON.stringify(v))}',old)
    page.reload()
    state=lambda:page.evaluate('JSON.parse(localStorage.getItem("ritme.v3"))')
    initial=state()
    assert initial['entries']==old['entries'] and initial['archives']==old['archives']
    assert len(initial['goals'])==5 and initial['startDate']==old['startDate']
    assert initial['goals'][-1]['icon']=='book' and initial['goals'][-1]['color']==4
    page.reload();assert state()==initial
    page.locator('#add-habit').click()
    assert page.locator('.suggestion').count()==13
    assert page.locator('[data-preset="slaap"]').is_disabled()
    assert page.locator('[data-preset="water"]').is_enabled()
    page.locator('[data-preset="water"]').click()
    water=state()['goals'][-1];assert water['icon']=='drop' and water['startDate']=='2026-09-30'
    page.locator('#add-habit').click();assert page.locator('[data-preset="water"]').is_disabled()
    page.locator('#custom-goal').click();page.locator('#habit-name').fill('  WATER   drinken ')
    page.locator('#habit-form button[type="submit"]').click()
    assert 'al in je lijst' in page.locator('#goal-error').inner_text()
    assert len(state()['goals'])==6
    page.locator('#habit-name').fill('Muziek maken')
    page.get_by_role('radio',name='Hart',exact=True).check()
    page.locator('#habit-form button[type="submit"]').click()
    music=state()['goals'][-1];assert music['icon']=='heart'
    for view,selector in [('vandaag','.daily-row'),('gewoontes','.journal-table tbody th'),('inzichten','.stat-row')]:
        page.locator(f'[data-view="{view}"]').click()
        row=page.locator(selector).filter(has_text='Muziek maken')
        assert row.locator('svg path').count()==1
        path=row.locator('svg path').get_attribute('d')
        if view=='vandaag':expected=path
        else:assert path==expected
    page.locator('[data-view="gewoontes"]').click();page.locator('#manage-goals').click()
    page.once('dialog',lambda d:d.dismiss());page.locator('[data-remove="slaap"]').click();assert state()['goals'][0]['id']=='slaap'
    # Failed deletion stays in memory and storage; error remains visible inside modal.
    page.evaluate('() => {window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error("quota")}}')
    page.once('dialog',lambda d:d.accept());page.locator('[data-remove="slaap"]').click()
    assert page.locator('#manage-error').is_visible();assert state()['entries']['2026-09-28']['checks']['slaap']
    page.evaluate('() => {Storage.prototype.setItem=window.realSet}')
    page.once('dialog',lambda d:d.accept());page.locator('[data-remove="slaap"]').click()
    after=state();assert all(g['id']!='slaap' for g in after['goals'])
    assert all('slaap' not in e['checks'] for e in after['entries'].values())
    assert after['archives']==old['archives'] and after['entries']['2026-09-28']['dienst']=='nacht'
    assert next(g for g in after['goals'] if g['id']=='h-custom')==initial['goals'][-1]
    page.locator('#close-manage').click();page.locator('[data-view="inzichten"]').click()
    assert page.locator('#stat-done').inner_text()=='2'
    page.locator('#add-habit').click();page.locator('[data-preset="slaap"]').click()
    readded=state()['goals'][-1];assert readded['id']!='slaap' and readded['startDate']=='2026-09-30'
    assert page.locator('#stat-done').inner_text()=='2'
    # New backup restores appearance and deleted defaults exactly.
    with page.expect_download() as info:page.locator('#export').click()
    exported=json.loads(Path(info.value.path()).read_text())
    def upload(v):
        page.locator('#import-file').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(v).encode()})
    page.once('dialog',lambda d:d.accept());upload(exported)
    page.wait_for_function('JSON.parse(localStorage.getItem("ritme.v3")).archives.length===2')
    assert state()['goals']==exported['goals']
    # v2 backups convert, preserving actual historical values.
    page.once('dialog',lambda d:d.accept());upload(old)
    page.wait_for_function('JSON.parse(localStorage.getItem("ritme.v3")).goals.length===5')
    assert state()['entries']==old['entries']
    # Keyboard icon picker, long labels and small screens.
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':844})
        page.locator('#add-habit').click();page.evaluate('document.fonts.ready')
        assert page.locator('#habit-dialog').evaluate('(d)=>d.scrollWidth<=d.clientWidth')
        page.screenshot(path=f'/tmp/ritme-goals-catalog-{width}.png')
        page.locator('#custom-goal').click()
        page.get_by_role('radio',name='Maan',exact=True).focus();page.keyboard.press('ArrowRight')
        assert page.get_by_role('radio',name='Blaadje',exact=True).is_checked()
        page.screenshot(path=f'/tmp/ritme-goals-custom-{width}.png')
        page.keyboard.press('Escape')
        page.locator('[data-view="gewoontes"]').click();page.locator('#manage-goals').click()
        page.screenshot(path=f'/tmp/ritme-goals-manage-{width}.png');page.keyboard.press('Escape')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    # Offline catalogue/add/delete and zero goals survive reload without resetting defaults.
    page.evaluate('navigator.serviceWorker.ready');page.wait_for_function('navigator.serviceWorker.controller!==null')
    context.set_offline(True);page.reload();page.locator('#add-habit').click();page.locator('[data-preset="fasting"]').click()
    assert state()['goals'][-1]['icon']=='fasting'
    page.locator('[data-view="gewoontes"]').click();page.locator('#manage-goals').click()
    page.on('dialog',lambda d:d.accept())
    while page.locator('[data-remove]').count():page.locator('[data-remove]').first.click()
    assert state()['goals']==[] and all(e['checks']=={} for e in state()['entries'].values())
    page.keyboard.press('Escape');page.reload()
    assert page.locator('#goals-empty').is_visible()
    page.locator('[data-view="inzichten"]').click();assert page.locator('#progress-percent').inner_text()=='—'
    assert page.locator('#stat-goals').inner_text()=='0'
    assert not errors,errors
    browser.close()
server.shutdown()
print('PASS: v2 migration, catalogue, explicit icons, duplicate names, deletion/cancel/failure, stable appearance, historical statistics, re-add, v2/v3 backups, keyboard, mobile dialogs, offline and zero goals.')

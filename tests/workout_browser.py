"""Browser regression checks. Run against a local Ritme server on port 8765.

Requires Python Playwright and Google Chrome. No browser download required.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = 'http://127.0.0.1:8765'
ARTIFACTS = Path('/private/tmp/ritme-checks')
ARTIFACTS.mkdir(exist_ok=True)


def open_workout(page):
    page.goto(URL)
    page.locator('#tab-workout').click()


with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless=True,
    )
    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True,
                                  has_touch=True, service_workers='block')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    open_workout(page)
    page.screenshot(path=str(ARTIFACTS / 'menu.png'), full_page=True)
    expect(page.locator('[data-minutes="5"]')).to_have_attribute('aria-pressed', 'true')
    assert page.locator('[data-preview]').count() == 5
    page.locator('[data-preview="pullup"]').click()
    expect(page.locator('dialog[open]')).to_contain_text('voeten vrij')
    assert page.locator('dialog[open] .wk-animate').count() == 1
    page.screenshot(path=str(ARTIFACTS / 'preview.png'), full_page=True)
    page.locator('[data-preview-motion]').click()
    assert page.locator('dialog[open] .wk-animate').count() == 0
    page.locator('[data-close]').click()

    # Start from a historical tracker date; completed workouts belong to today.
    page.locator('#tab-vandaag').click()
    page.locator('#prevDay').click()
    page.locator('#tab-workout').click()
    page.clock.install()
    page.locator('[data-action="start"]').click()
    expect(page.locator('#wk-clock')).to_have_text('0:30')
    page.clock.run_for(10000)
    expect(page.locator('#wk-clock')).to_have_text('0:20')
    page.locator('[data-action="pause"]').click()
    paused = page.locator('#wk-clock').inner_text()
    page.clock.run_for(60000)
    expect(page.locator('#wk-clock')).to_have_text(paused)
    page.locator('[data-action="pause"]').click()
    page.clock.run_for(20000)
    expect(page.locator('.wk-player-body h2')).to_have_text('Hollow rocks')
    page.screenshot(path=str(ARTIFACTS / 'player.png'), full_page=True)
    page.clock.run_for(30000)
    expect(page.locator('.wk-player-body h2')).to_have_text('Even op adem komen')
    expect(page.locator('#wk-clock')).to_have_text('0:20')
    page.clock.run_for(20000)
    expect(page.locator('.wk-player-body h2')).to_have_text('Optrekken aan de trap')

    # Navigation pauses and a reload restores a paused workout.
    page.locator('#tab-overzicht').click()
    page.clock.run_for(10000)
    page.locator('#tab-workout').click()
    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
    page.reload()
    page.locator('#tab-workout').click()
    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
    expect(page.locator('.wk-player-body h2')).to_have_text('Optrekken aan de trap')
    page.clock.install()
    page.locator('[data-action="pause"]').click()
    page.clock.run_for(220000)
    expect(page.locator('.wk-complete')).to_be_visible()
    assert page.evaluate('JSON.parse(localStorage.getItem("ritme.workout.v1")).elapsed') == 20
    page.locator('[data-action="log"]').click()
    expect(page.locator('[data-action="log"]')).to_be_disabled()
    result = page.evaluate('JSON.parse(localStorage.getItem("ritme.v1"))')
    today = page.evaluate('ymd(new Date())')
    assert result['entries'][today]['sport'] == 5, result
    assert len(result['entries'][today]['workouts']) == 1
    page.reload()
    page.locator('#tab-workout').click()
    expect(page.locator('[data-action="log"]')).to_be_disabled()
    page.screenshot(path=str(ARTIFACTS / 'complete.png'), full_page=True)

    # Ten minutes is exactly two rounds including warm-up, rest and cooldown.
    page.locator('[data-action="new"]').click()
    page.locator('[data-minutes="10"]').click()
    expect(page.locator('[data-action="start"]')).to_have_text('▶Start 10 minuten')
    page.clock.install()
    page.locator('[data-action="start"]').click()
    expect(page.locator('#wk-total')).to_have_text('10:00 over')
    page.clock.run_for(310000)
    expect(page.locator('#wk-stage-tag')).to_have_text('Ronde 2 van 2')
    expect(page.locator('.wk-player-body h2')).to_have_text('Hollow rocks')
    page.clock.run_for(289000)
    expect(page.locator('#wk-clock')).to_have_text('0:01')
    page.clock.run_for(1000)
    expect(page.locator('.wk-complete')).to_be_visible()
    page.locator('[data-action="log"]').click()
    expect(page.locator('[data-action="log"]')).to_be_disabled()
    assert page.evaluate('JSON.parse(localStorage.getItem("ritme.v1")).entries[ymd(new Date())].sport') == 15

    # Stopping needs an explicit choice and must never log a partial workout.
    page.locator('[data-action="new"]').click()
    page.locator('[data-action="start"]').click()
    page.locator('[data-action="stop"]').click()
    expect(page.locator('dialog[open]')).to_be_visible()
    page.locator('[data-continue]').click()
    expect(page.locator('[data-action="pause"]')).to_contain_text('Pauzeren')
    page.locator('[data-action="stop"]').click()
    page.locator('[data-stop-confirm]').click()
    assert page.evaluate('localStorage.getItem("ritme.workout.v1")') is None
    assert page.evaluate('JSON.parse(localStorage.getItem("ritme.v1")).entries[ymd(new Date())].sport') == 15

    # Device sleep must pause, not skip ahead and credit an unattended workout.
    page.locator('[data-action="start"]').click()
    page.clock.fast_forward(60000)
    expect(page.locator('#wk-stage-tag')).to_have_text('Gepauzeerd')
    expect(page.locator('#wk-clock')).to_have_text('1:00')
    page.locator('[data-action="stop"]').click()
    page.locator('[data-stop-confirm]').click()

    # Small and wide layouts, dark mode, and reduced motion.
    page.emulate_media(color_scheme='dark', reduced_motion='reduce')
    for width in [320, 768, 1280]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.locator('[data-preview="handstand"]').click()
    assert page.locator('dialog[open] .wk-animate').count() == 0
    page.locator('[data-preview-motion]').click()
    assert page.locator('dialog[open] .wk-motion-requested').count() == 1
    page.locator('[data-close]').click()
    assert not errors, errors
    context.close()

    # Fresh installation caches all workout artwork and still works offline.
    offline_context = browser.new_context(viewport={'width': 390, 'height': 844})
    offline = offline_context.new_page()
    open_workout(offline)
    offline.evaluate('navigator.serviceWorker.ready')
    offline.reload()
    offline.wait_for_function('navigator.serviceWorker.controller !== null')
    cached = offline.evaluate('caches.keys().then(async keys => (await (await caches.open(keys.find(k => k.startsWith("ritme-")))).keys()).map(r => new URL(r.url).pathname))')
    for name in ['hollow', 'crunch', 'taps-front', 'handstand', 'pullup']:
        assert '/assets/workout/' + name + '.png' in cached
    offline_context.set_offline(True)
    offline.reload()
    offline.locator('#tab-workout').click()
    offline.locator('[data-action="start"]').click()
    expect(offline.locator('#wk-clock')).to_be_visible()
    assert offline.evaluate('fetch("assets/workout/handstand.png").then(r => r.ok)')
    offline_context.close()
    browser.close()
    print(json.dumps({'result': 'PASS', 'screenshots': str(ARTIFACTS), 'browser_errors': errors}))

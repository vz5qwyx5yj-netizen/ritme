"""Build both apps for the existing GitHub Pages root, without changing Ritme's URL.

Run `python3 build.py` before upload, or supply --output /private/tmp/gezondheid-site.
Only explicitly listed public files are copied. Source files remain in Ritme/Workout.
"""
import argparse
import hashlib
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TRACKER_FILES = ['index.html', 'habits.js', 'habits.css', 'manifest.json', 'sw.js', 'icons']
WORKOUT_FILES = ['index.html', 'workout.js', 'workout.css', 'app.css', 'manifest.json', 'sw.js', 'icons', 'assets']


def copy_files(source, target, names):
    target.mkdir(parents=True, exist_ok=True)
    for name in names:
        src, dst = source / name, target / name
        if src.is_dir():
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(src, dst)


def stamp(target, names, prefix):
    files = []
    for name in names:
        path = target / name
        files.extend(sorted(p for p in path.rglob('*') if p.is_file()) if path.is_dir() else [path])
    digest = hashlib.sha256()
    for path in files:
        content = path.read_bytes()
        if path.name == 'sw.js':
            content = re.sub(rb"const CACHE = '[^']+';", b"const CACHE = 'VERSION';", content)
        digest.update(str(path.relative_to(target)).encode() + b'\0' + content)
    worker = target / 'sw.js'
    worker.write_text(re.sub(r"const CACHE = '[^']+';", f"const CACHE = '{prefix}-{digest.hexdigest()[:16]}';", worker.read_text()))


def build(target):
    target = target.resolve()
    if target != ROOT and (ROOT / 'Ritme' in [target, *target.parents] or ROOT / 'Workout' in [target, *target.parents]):
        raise ValueError('Kies een uitvoermap buiten de bronmappen Ritme en Workout.')
    copy_files(ROOT / 'Ritme', target, TRACKER_FILES)
    index = target / 'index.html'
    index.write_text(index.read_text().replace('href="../Workout/"', 'href="Workout/"'))
    if target != ROOT:
        copy_files(ROOT / 'Workout', target / 'Workout', WORKOUT_FILES)
    stamp(target, TRACKER_FILES, 'ritme')
    stamp(target / 'Workout', WORKOUT_FILES, 'workout')
    (target / '.nojekyll').touch()
    print(f'Gereed: {target}\nRitme: / · Workout: /Workout/')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT)
    build(parser.parse_args().output)

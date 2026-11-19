import os
from pathlib import Path
import subprocess
import tempfile
import unittest


class DeploymentTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.base = self.root / 'app'
        (self.base / 'shared').mkdir(parents=True)
        (self.base / '.env').write_text('APP_IMAGE_TAG=previous\nAPP_DOMAIN=wf-checkout.whoptools.com\n')
        self.previous = self.base / 'releases' / 'previous'
        self.previous.mkdir(parents=True)
        (self.previous / '.env').write_text('APP_IMAGE_TAG=previous\n')
        (self.previous / 'compose.yaml').touch()
        (self.base / 'current').symlink_to(self.previous)
        self.commands = self.root / 'bin'
        self.commands.mkdir()
        self.log = self.root / 'commands.log'
        self.revision = 'a' * 40
        self.env = dict(os.environ, PATH=f'{self.commands}:{os.environ["PATH"]}',
                        TEST_ROOT=str(self.root), TEST_SHA=self.revision)
        source = Path(__file__).with_name('hetzner.sh').read_text()
        self.script = self.root / 'deploy.sh'
        self.script.write_text(source.replace('base=/opt/webflow-whop', f'base={self.base}').replace('/opt/pay-whop/shared/deploy.lock', str(self.base / 'shared' / 'deploy.lock')))
        self.command('flock', 'exit 0')
        self.command('git', 'printf "%s\\trefs/heads/main\\n" "$TEST_SHA"')
        self.command('curl', 'if [[ ${FAIL_HEALTH:-} == yes && $* == *https://wf-checkout.whoptools.com/health* ]]; then exit 42; fi')
        self.command('tar', '''
while [[ $# -gt 0 ]]; do
  if [[ $1 == -C ]]; then destination=$2; break; fi
  shift
done
mkdir -p "$destination/deploy"
touch "$destination/deploy/compose.yaml" "$destination/deploy/Dockerfile"
''')
        self.command('docker', '''
printf '%s\\n' "$*" >> "$TEST_ROOT/commands.log"
if [[ ${FAIL_BUILD:-} == yes && $1 == buildx && $2 == build ]]; then exit 42; fi
if [[ ${FAIL_ACTIVATION:-} == yes && $1 == compose && $* == *" up "* && ! -f "$TEST_ROOT/failed" ]]; then
  touch "$TEST_ROOT/failed"
  exit 42
fi
''')

    def command(self, name, content):
        path = self.commands / name
        path.write_text('#!/usr/bin/env bash\nset -eu\n' + content + '\n')
        path.chmod(0o755)

    def deploy(self, command=None, **environment):
        return subprocess.run(['bash', str(self.script), command or f'deploy {self.revision}'],
                              env=dict(self.env, **environment), capture_output=True, text=True)

    def test_rejects_arbitrary_commands(self):
        self.assertEqual(64, self.deploy('whoami').returncode)
        self.assertFalse(self.log.exists())

    def test_skips_superseded_revision(self):
        self.assertEqual(0, self.deploy(TEST_SHA='b' * 40).returncode)
        self.assertFalse(self.log.exists())
        self.assertEqual(self.previous, (self.base / 'current').resolve())

    def test_build_failure_keeps_current_app(self):
        self.assertNotEqual(0, self.deploy(FAIL_BUILD='yes').returncode)
        self.assertNotIn(' up ', self.log.read_text())
        self.assertEqual(self.previous, (self.base / 'current').resolve())

    def test_activation_failure_restores_previous_release(self):
        self.assertNotEqual(0, self.deploy(FAIL_ACTIVATION='yes').returncode)
        activations = [line for line in self.log.read_text().splitlines() if line.startswith('compose ') and ' up ' in line]
        self.assertEqual(2, len(activations))
        self.assertIn(str(self.previous / 'compose.yaml'), activations[-1])
        self.assertEqual(self.previous, (self.base / 'current').resolve())

    def test_https_failure_restores_previous_release(self):
        self.assertNotEqual(0, self.deploy(FAIL_HEALTH='yes').returncode)
        activations = [line for line in self.log.read_text().splitlines() if line.startswith('compose ') and ' up ' in line]
        self.assertEqual(2, len(activations))
        self.assertIn(str(self.previous / 'compose.yaml'), activations[-1])
        self.assertEqual(self.previous, (self.base / 'current').resolve())

    def test_success_advances_release(self):
        result = self.deploy()
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(self.base / 'releases' / self.revision, (self.base / 'current').resolve())
        self.assertIn('exec kamal-proxy kamal-proxy deploy whoptools-wf-checkout', self.log.read_text())


if __name__ == '__main__':
    unittest.main()

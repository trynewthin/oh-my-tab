"""Check distributable structure without extracting package contents."""
import json
import struct
import zipfile
from pathlib import Path

packages = Path("packages")
archives = list(packages.glob("*.zip"))
assert archives, "Missing extension ZIP"
for archive in archives:
    with zipfile.ZipFile(archive) as bundle:
        names = bundle.namelist()
        assert all(not name.endswith((".pem", ".key")) for name in names), "Private key in package"
        manifest = json.loads(bundle.read("manifest.json"))
        assert manifest["manifest_version"] == 3
        assert manifest["chrome_url_overrides"]["newtab"] in names
        assert manifest["action"]["default_popup"] in names
        assert all(name in names for name in manifest["icons"].values())
        assert bundle.testzip() is None
    print(f"Verified {archive.name}")
for package in packages.glob("*.crx"):
    content = package.read_bytes()
    assert content[:4] == b"Cr24", "Invalid CRX signature"
    version, header_size = struct.unpack("<II", content[4:12])
    assert version == 3, "Expected CRX3"
    assert 12 + header_size < len(content), "Truncated CRX"
    assert content[12 + header_size:16 + header_size] == b"PK\x03\x04", "Missing ZIP payload"
    print(f"Verified {package.name}")

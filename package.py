from zipfile import ZipFile, ZIP_DEFLATED
import os

NEED_PACKED = [
    'dist',
    'ico',
    'manifest.json',
    'LICENSE',
]

def pack():
    with ZipFile('bookdownload.crx', 'w', compression=ZIP_DEFLATED, compresslevel=9) as zip:
        for item in NEED_PACKED:
            if not os.path.exists(item):
                print(f'Warning: {item} does not exist, skipping.')
                continue
            if os.path.isdir(item):
                for foldername, subfolders, filenames in os.walk(item):
                    for filename in filenames:
                        zip.write(os.path.join(foldername, filename))
            else:
                zip.write(item)


if __name__ == '__main__':
    pack()

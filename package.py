from zipfile import ZipFile, ZIP_DEFLATED
import os
from crx3 import creator

NEED_PACKED = [
    'dist',
    'ico',
    'inject',
    'manifest.json',
    'LICENSE',
]

def pack():
    with ZipFile('bookdownload.zip', 'w', compression=ZIP_DEFLATED, compresslevel=9) as zip:
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
    creator.create_crx_file('bookdownload.zip', 'bookdownload.pem', './bookdownload.crx')
    os.remove('bookdownload.zip')


if __name__ == '__main__':
    pack()

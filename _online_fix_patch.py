# -*- coding: utf-8 -*-
import sys

FILES = [
    ('src/lib/localAi.ts', [
        ('proxy-store-v2', '''const ZHIPU_PROXY_STORE = "nh.zhipu.proxy.v1";''', '''// v2：旧版清空地址会写入 "off"，升级后作废，默认走共享代理
const ZHIPU_PROXY_STORE = "nh.zhipu.proxy.v2";'''),
    ]),
    ('public/sw.js', [
        ('nav-no-store', '''      fetch(req)
        .then((res) => {''', '''      fetch(req, { cache: "no-store" })
        .then((res) => {'''),
    ]),
]

fail = False
for path, items in FILES:
    raw = open(path, 'rb').read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig').replace('\r\n', '\n')
    for label, old, new in items:
        n = text.count(old)
        if n != 1:
            print('FAIL', path, label, 'count=', n)
            fail = True
    if fail:
        continue
    for label, old, new in items:
        text = text.replace(old, new, 1)
        print('OK', path, label)
    data = text.encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    open(path, 'wb').write(data)
    print('written', path, len(data))

if fail:
    sys.exit(1)
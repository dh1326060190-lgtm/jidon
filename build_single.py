import pathlib
base = pathlib.Path(r"D:/workbuddy任务文件/2026-08-14-09-22-29/肌动工作台")
assets = base / "assets"
css = (assets / "style.css").read_text(encoding="utf-8")
art = (assets / "art.js").read_text(encoding="utf-8")
data = (assets / "data.js").read_text(encoding="utf-8")
app = (assets / "app.js").read_text(encoding="utf-8")

def safe(s):  # 防止 </script> 提前闭合
    return s.replace("</script", "<\\/script")

html = (base / "index.html").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="assets/style.css">', f'<style>{css}</style>')
html = html.replace('<script src="assets/art.js"></script>', f'<script>{safe(art)}</script>')
html = html.replace('<script src="assets/data.js"></script>', f'<script>{safe(data)}</script>')
html = html.replace('<script src="assets/app.js"></script>', f'<script>{safe(app)}</script>')

out = base / "肌动工作台-单文件.html"
out.write_text(html, encoding="utf-8")
print("written:", out)
print("size(KB):", round(out.stat().st_size / 1024, 1))
# 校验是否还有外部引用
leftover = [x for x in ["assets/style.css", "assets/art.js", "assets/data.js", "assets/app.js"] if x in html]
print("leftover external refs:", leftover)

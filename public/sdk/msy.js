function i(t) {
  return new Promise((n, o) => {
    t.toBlob((r) => {
      if (r === null) {
        o("截屏失败");
        return;
      }
      const e = new Image();
      e.src = URL.createObjectURL(r), n(e);
    });
  });
}
function u(t, n) {
  return new Promise((o, r) => {
    i(t).then((e) => {
      const c = document.createElement("a");
      c.href = e.src, c.download = n || `screencapture-${t.width}x${t.height}.png`, c.click(), o();
    }).catch((e) => {
      r(e);
    });
  });
}
const a = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getViewportImage: i,
  saveScreenCapture: u
}, Symbol.toStringTag, { value: "Module" })), l = {
  Utils: a
};
export {
  l as default
};

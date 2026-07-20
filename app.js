/* AI チーム — 一覧・検索・絞り込み・召喚フレーズのコピー・振り分け */
(function () {
  "use strict";

  var DATA = null;
  var filter = "all";
  var query = "";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 起動 ---------- */
  fetch("team.json?v=1")
    .then(function (r) { return r.json(); })
    .then(function (d) { DATA = d; boot(); })
    .catch(function () {
      $("roster").innerHTML =
        '<p class="empty">データを読み込めませんでした。通信を確認して開き直してください。</p>';
    });

  function boot() {
    buildChips();
    render();
    $("meta").textContent =
      DATA.people.length + "人 · 更新 " + DATA.updated + " · v" + DATA.version;

    $("q").addEventListener("input", function (e) {
      query = e.target.value.trim().toLowerCase();
      $("q-clear").hidden = !query;
      render();
    });
    $("q-clear").addEventListener("click", function () {
      $("q").value = ""; query = ""; this.hidden = true; render(); $("q").focus();
    });

    $("triage-open").addEventListener("click", openTriage);

    /* シートを閉じる */
    document.addEventListener("click", function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute("data-close")) closeSheets();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSheets();
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  /* ---------- チップ ---------- */
  function buildChips() {
    var wrap = $("chips");
    var defs = [{ id: "all", label: "全員" }].concat(DATA.groups);

    defs.forEach(function (g) {
      var n = g.id === "all"
        ? DATA.people.length
        : DATA.people.filter(function (p) { return p.group === g.id; }).length;

      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.group = g.id;
      b.setAttribute("aria-pressed", g.id === filter ? "true" : "false");
      b.innerHTML = '<b></b><span class="n"></span>';
      b.querySelector("b").textContent = g.label;
      b.querySelector(".n").textContent = n;

      b.addEventListener("click", function () {
        filter = g.id;
        Array.prototype.forEach.call(wrap.children, function (c) {
          c.setAttribute("aria-pressed", c.dataset.group === filter ? "true" : "false");
        });
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      wrap.appendChild(b);
    });
  }

  /* ---------- 一覧 ---------- */
  function matches(p) {
    if (filter !== "all" && p.group !== filter) return false;
    if (!query) return true;
    var hay = [p.name, p.ja, p.title, p.summary, p.tags.join(" "), p.use.join(" ")]
      .join(" ").toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function render() {
    var list = DATA.people.filter(matches);
    var roster = $("roster");
    roster.innerHTML = "";

    list.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "person" + (p.status === "contract" ? " contract" : "");

      var row = document.createElement("div");
      row.className = "row";
      row.appendChild(el("span", "nm", p.name));
      if (p.ja) row.appendChild(el("span", "ja", p.ja));
      if (p.status === "contract") row.appendChild(el("span", "badge", "外注"));
      b.appendChild(row);

      b.appendChild(el("div", "ttl", p.title));
      b.appendChild(el("p", "sm", p.summary));

      b.addEventListener("click", function () { openPerson(p); });
      roster.appendChild(b);
    });

    $("empty").hidden = list.length !== 0;
    $("count").textContent = list.length + " / " + DATA.people.length + " 人";
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    n.className = cls;
    n.textContent = text;
    return n;
  }

  /* ---------- 詳細 ---------- */
  function openPerson(p) {
    $("sheet-name").textContent = p.name + (p.ja ? "（" + p.ja + "）" : "");
    $("sheet-title").textContent = p.title + (p.status === "contract" ? " · 外注" : "");
    $("sheet-summary").textContent = p.summary;

    var ul = $("sheet-use");
    ul.innerHTML = "";
    p.use.forEach(function (u) {
      var li = document.createElement("li");
      li.textContent = u;
      ul.appendChild(li);
    });

    var tg = $("sheet-tags");
    tg.innerHTML = "";
    p.tags.forEach(function (t) {
      var s = document.createElement("span");
      s.textContent = t;
      tg.appendChild(s);
    });

    var phrase = p.name + "を召喚して";
    var btn = $("copy");
    btn.textContent = "「" + phrase + "」をコピー";
    $("copied").textContent = "";
    btn.onclick = function () { copy(phrase); };

    show($("sheet"));
  }

  function copy(text) {
    var done = function () { $("copied").textContent = "コピーしました"; };
    var fail = function () { $("copied").textContent = "コピーできませんでした。長押しで選択してください。"; };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }

    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? done() : fail();
      } catch (e) { fail(); }
    }
  }

  /* ---------- 誰に頼む ---------- */
  var stepIndex = 0;

  function openTriage() {
    stepIndex = 0;
    renderStep(DATA.triage[0], 1);
    show($("triage"));
  }

  function stepById(id) {
    for (var i = 0; i < DATA.triage.length; i++) {
      if (DATA.triage[i].id === id) return DATA.triage[i];
    }
    return null;
  }

  function renderStep(step, n) {
    $("triage-step").textContent = "質問 " + n;
    $("triage-q").textContent = step.q;
    $("triage-result").hidden = true;
    $("triage-result").innerHTML = "";
    $("triage-restart").hidden = true;

    var box = $("triage-options");
    box.hidden = false;
    box.innerHTML = "";

    step.options.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = o.label;
      b.addEventListener("click", function () {
        if (o.next) {
          var nx = stepById(o.next);
          if (nx) return renderStep(nx, n + 1);
        }
        showResult(o.to || []);
      });
      box.appendChild(b);
    });
  }

  function showResult(ids) {
    $("triage-step").textContent = "結果";
    $("triage-q").textContent = ids.length > 1 ? "この2人で組みます" : "この人です";
    $("triage-options").hidden = true;

    var box = $("triage-result");
    box.hidden = false;
    box.innerHTML = "";

    ids.forEach(function (id) {
      var p = DATA.people.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "person" + (p.status === "contract" ? " contract" : "");
      var row = document.createElement("div");
      row.className = "row";
      row.appendChild(el("span", "nm", p.name));
      if (p.ja) row.appendChild(el("span", "ja", p.ja));
      row.appendChild(el("span", "go", "›"));
      b.appendChild(row);
      b.appendChild(el("div", "ttl", p.title));
      b.appendChild(el("p", "sm", p.summary));
      b.addEventListener("click", function () {
        closeSheets();
        openPerson(p);
      });
      box.appendChild(b);
    });

    var again = $("triage-restart");
    again.hidden = false;
    again.onclick = openTriage;
  }

  /* ---------- 共通 ---------- */
  function show(sheet) {
    closeSheets();
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeSheets() {
    $("sheet").hidden = true;
    $("triage").hidden = true;
    document.body.style.overflow = "";
  }
})();

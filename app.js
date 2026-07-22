/* AI チーム — 人（17人）とスキル（58個）の2ビュー。検索・絞り込み・コピー・振り分け。 */
(function () {
  "use strict";

  var TEAM = null;     // team.json
  var SKILLS = null;   // skills.json
  var FRAMES = null;   // frames.json
  var view = "people"; // "people" | "skills" | "frames"
  var filter = { people: "all", skills: "all" };
  var query = "";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 起動 ---------- */
  Promise.all([
    fetch("team.json?v=1").then(function (r) { return r.json(); }),
    fetch("skills.json?v=2").then(function (r) { return r.json(); }),
    fetch("frames.json?v=1").then(function (r) { return r.json(); })
  ]).then(function (res) {
    TEAM = res[0]; SKILLS = res[1]; FRAMES = res[2]; boot();
  }).catch(function () {
    $("roster").innerHTML =
      '<p class="empty">データを読み込めませんでした。通信を確認して開き直してください。</p>';
  });

  function boot() {
    setView("people");

    $("tab-people").addEventListener("click", function () { setView("people"); });
    $("tab-skills").addEventListener("click", function () { setView("skills"); });
    $("tab-frames").addEventListener("click", function () { setView("frames"); });

    $("q").addEventListener("input", function (e) {
      query = e.target.value.trim().toLowerCase();
      $("q-clear").hidden = !query;
      render();
    });
    $("q-clear").addEventListener("click", function () {
      $("q").value = ""; query = ""; this.hidden = true; render(); $("q").focus();
    });

    $("triage-open").addEventListener("click", openTriage);

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

  /* ---------- ビュー切替 ---------- */
  function setView(v) {
    view = v;
    $("tab-people").setAttribute("aria-selected", v === "people" ? "true" : "false");
    $("tab-skills").setAttribute("aria-selected", v === "skills" ? "true" : "false");
    $("tab-frames").setAttribute("aria-selected", v === "frames" ? "true" : "false");
    $("triage-open").hidden = v !== "people";
    $("chips").hidden = v === "frames";
    $("q").placeholder = v === "people" ? "名前・役割・やりたいこと"
      : v === "skills" ? "スキル名・やりたいこと"
      : "フレーム名・やりたいこと";
    if (v !== "frames") buildChips();
    render();
    window.scrollTo({ top: 0 });
  }

  /* ---------- チップ ---------- */
  function buildChips() {
    var wrap = $("chips");
    wrap.innerHTML = "";
    var cur = filter[view];

    var defs, countOf;
    if (view === "people") {
      defs = [{ id: "all", label: "全員" }].concat(TEAM.groups);
      countOf = function (id) {
        return id === "all" ? TEAM.people.length
          : TEAM.people.filter(function (p) { return p.group === id; }).length;
      };
    } else {
      defs = [{ id: "all", label: "全部" }].concat(SKILLS.cats);
      countOf = function (id) {
        return id === "all" ? SKILLS.skills.length
          : SKILLS.skills.filter(function (s) { return s.cat === id; }).length;
      };
    }

    defs.forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.id = g.id;
      b.setAttribute("aria-pressed", g.id === cur ? "true" : "false");
      b.innerHTML = '<b></b><span class="n"></span>';
      b.querySelector("b").textContent = g.label;
      b.querySelector(".n").textContent = countOf(g.id);
      b.addEventListener("click", function () {
        filter[view] = g.id;
        Array.prototype.forEach.call(wrap.children, function (c) {
          c.setAttribute("aria-pressed", c.dataset.id === g.id ? "true" : "false");
        });
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      wrap.appendChild(b);
    });
  }

  /* ---------- 一覧 ---------- */
  function render() {
    if (view === "people") return renderPeople();
    if (view === "skills") return renderSkills();
    return renderFrames();
  }

  function renderPeople() {
    var f = filter.people;
    var list = TEAM.people.filter(function (p) {
      if (f !== "all" && p.group !== f) return false;
      if (!query) return true;
      var hay = [p.name, p.ja, p.title, p.summary, p.tags.join(" "), p.use.join(" ")]
        .join(" ").toLowerCase();
      return hay.indexOf(query) !== -1;
    });

    var roster = $("roster");
    roster.innerHTML = "";
    list.forEach(function (p) {
      var b = card(p.status === "contract");
      var row = el("div", "row");
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
    $("count").textContent = list.length + " / " + TEAM.people.length + " 人";
    $("meta").textContent =
      TEAM.people.length + "人 · 更新 " + TEAM.updated;
  }

  function renderSkills() {
    var f = filter.skills;
    var list = SKILLS.skills.filter(function (s) {
      if (f !== "all" && s.cat !== f) return false;
      if (!query) return true;
      var hay = [s.name, s.slug, s.what, s.trigger, s.loc].join(" ").toLowerCase();
      return hay.indexOf(query) !== -1;
    });

    var roster = $("roster");
    roster.innerHTML = "";
    list.forEach(function (s) {
      var b = card(false);
      var row = el("div", "row");
      row.appendChild(el("span", "nm", s.name));
      row.appendChild(el("span", "loc " + s.loc, locShort(s.loc)));
      b.appendChild(row);
      b.appendChild(el("code", "slug", s.slug));
      b.appendChild(el("p", "sm", s.what));
      b.addEventListener("click", function () { openSkill(s); });
      roster.appendChild(b);
    });

    $("empty").hidden = list.length !== 0;
    $("count").textContent = list.length + " / " + SKILLS.skills.length + " 個";
    $("meta").textContent =
      SKILLS.skills.length + "個 · 更新 " + SKILLS.updated;
  }

  function renderFrames() {
    var list = FRAMES.frames.filter(function (f) {
      if (!query) return true;
      var hay = [f.name, f.slug, f.sub, f.what, f.template].join(" ").toLowerCase();
      return hay.indexOf(query) !== -1;
    });

    var roster = $("roster");
    roster.innerHTML = "";
    list.forEach(function (f) {
      var b = card(false);
      var row = el("div", "row");
      row.appendChild(el("span", "nm", f.name));
      row.appendChild(el("span", "go", "›"));
      b.appendChild(row);
      b.appendChild(el("div", "ttl", f.sub));
      b.appendChild(el("p", "sm", f.what));
      b.addEventListener("click", function () { openFrame(f); });
      roster.appendChild(b);
    });

    $("empty").hidden = list.length !== 0;
    $("count").textContent = list.length + " / " + FRAMES.frames.length + " 個";
    $("meta").textContent = FRAMES.frames.length + "個の思考フレーム · 更新 " + FRAMES.updated;
  }

  function locShort(loc) {
    return loc === "user" ? "Code" : loc === "obsidian" ? "Obsidian" : "Plugin";
  }
  function locLong(loc) {
    return loc === "user" ? "Claude Code" : loc === "obsidian" ? "Obsidian作業" : "プラグイン";
  }

  function card(isContract) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "person" + (isContract ? " contract" : "");
    return b;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- 詳細（人） ---------- */
  function openPerson(p) {
    $("block-template").hidden = true;
    $("block-use").hidden = false;
    $("sheet-name").textContent = p.name + (p.ja ? "（" + p.ja + "）" : "");
    $("sheet-title").textContent = p.title + (p.status === "contract" ? " · 外注" : "");
    $("sheet-summary").textContent = p.summary;

    $("use-label").textContent = "こんな時";
    fillList($("sheet-use"), p.use);

    $("tags-label").textContent = "トリガー";
    fillTags($("sheet-tags"), p.tags);
    $("block-tags").hidden = false;

    setCopy(p.name + "を召喚して");
    show($("sheet"));
  }

  /* ---------- 詳細（スキル） ---------- */
  function openSkill(s) {
    $("block-template").hidden = true;
    $("block-use").hidden = false;
    $("sheet-name").textContent = s.name;
    $("sheet-title").textContent = s.slug + " · " + locLong(s.loc);
    $("sheet-summary").textContent = s.what;

    $("use-label").textContent = "起動の一言";
    fillList($("sheet-use"), s.trigger.split(" / "));

    $("block-tags").hidden = true;

    var copyText = firstTrigger(s.trigger);
    if (copyText) {
      setCopy(copyText, "「" + copyText + "」をコピー");
      $("copy").hidden = false;
    } else {
      // 自動発火のみ = コピーする言葉がない。ボタンを出さない。
      $("copy").hidden = true;
      $("copied").textContent = "";
    }
    show($("sheet"));
  }

  /* ---------- 詳細（フレーム） ---------- */
  function openFrame(f) {
    $("sheet-name").textContent = f.name;
    $("sheet-title").textContent = f.sub;
    $("sheet-summary").textContent = f.what;

    $("block-template").hidden = false;
    $("sheet-template").textContent = f.template;

    $("block-tags").hidden = true;

    if (f.examples && f.examples.length) {
      $("block-use").hidden = false;
      $("use-label").textContent = "例";
      fillList($("sheet-use"), f.examples);
    } else {
      $("block-use").hidden = true;
    }

    setCopy(f.template, "プロンプトをコピー");
    show($("sheet"));
  }

  /* 貼って意味のあるトリガーを返す。自動発火しかなければ null。 */
  function firstTrigger(trigger) {
    var parts = trigger.split(" / ");
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].trim().indexOf("自動で発火") !== 0) return parts[i].trim();
    }
    return null;
  }

  function fillList(ul, items) {
    ul.innerHTML = "";
    items.forEach(function (t) {
      ul.appendChild(el("li", null, t.trim()));
    });
  }
  function fillTags(box, tags) {
    box.innerHTML = "";
    tags.forEach(function (t) { box.appendChild(el("span", null, t)); });
  }

  function setCopy(text, label) {
    var btn = $("copy");
    btn.hidden = false;
    btn.textContent = label || ("「" + text + "」をコピー");
    $("copied").textContent = "";
    btn.onclick = function () { copy(text); };
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
        ta.value = text; ta.setAttribute("readonly", "");
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select(); ta.setSelectionRange(0, text.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? done() : fail();
      } catch (e) { fail(); }
    }
  }

  /* ---------- 誰に頼む（人のみ） ---------- */
  function openTriage() {
    renderStep(TEAM.triage[0], 1);
    show($("triage"));
  }
  function stepById(id) {
    for (var i = 0; i < TEAM.triage.length; i++) {
      if (TEAM.triage[i].id === id) return TEAM.triage[i];
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
      var b = el("button", null, o.label);
      b.type = "button";
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
      var p = TEAM.people.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      var b = card(p.status === "contract");
      var row = el("div", "row");
      row.appendChild(el("span", "nm", p.name));
      if (p.ja) row.appendChild(el("span", "ja", p.ja));
      row.appendChild(el("span", "go", "›"));
      b.appendChild(row);
      b.appendChild(el("div", "ttl", p.title));
      b.appendChild(el("p", "sm", p.summary));
      b.addEventListener("click", function () { closeSheets(); openPerson(p); });
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

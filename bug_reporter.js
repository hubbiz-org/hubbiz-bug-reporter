// bug-widget.js
(function () {
  // === CONFIG FROM SCRIPT TAG ===
  const scriptTag = document.currentScript;
  const btnColor = scriptTag.getAttribute("colorBtn") || "#ff5722";
  const btnTextColor = scriptTag.getAttribute("colorBtnText") || "#fff";
  const btnText = scriptTag.getAttribute("btnText") || "Report a Bug";
  const btnPosition = scriptTag.getAttribute("btnPosition") || "bottom-right";
  const apiEndpoint = scriptTag.getAttribute("apiEndpoint") || "https://httpbin.org/post";

  // === FLOATING BUTTON ===
  const btn = document.createElement("button");
  btn.textContent = btnText;
  btn.style.position = "fixed";
  btn.style[btnPosition.includes("bottom") ? "bottom" : "top"] = "20px";
  btn.style[btnPosition.includes("right") ? "right" : "left"] = "20px";
  btn.style.backgroundColor = btnColor;
  btn.style.color = btnTextColor;
  btn.style.border = "none";
  btn.style.padding = "10px 15px";
  btn.style.borderRadius = "5px";
  btn.style.cursor = "pointer";
  btn.style.zIndex = 99999;
  document.body.appendChild(btn);

  // === SCRIPT LOADER ===
  function loadScript(url) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  // === CREATE MODAL WITH ANNOTATION ===
  function createModal(imageData) {
    const modal = document.createElement("div");
    modal.style = `
      position: fixed;
      top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.6);
      z-index: 100000;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    `;

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.style = "margin-bottom: 10px; background: white; padding: 5px; border-radius: 5px;";
    toolbar.innerHTML = `
      <button id="modePen">Pen</button>
      <button id="modeRect">Rectangle</button>
      <input type="color" id="colorPicker" value="#ff0000" />
      <button id="undoBtn">Undo</button>
    `;

    // Canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    let drawing = false;
    let mode = "pen";
    let drawColor = "#ff0000";
    let startX = 0, startY = 0;
    let tempRect = null;
    let actions = [];

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
    canvas.style = "border: 2px solid #ccc; max-width:90%; max-height:70%; cursor: crosshair;";

    // Redraw actions
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      actions.forEach(action => {
        ctx.strokeStyle = action.color;
        ctx.lineWidth = 2;
        if (action.type === "pen") {
          ctx.beginPath();
          action.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
        } else if (action.type === "rect") {
          ctx.strokeRect(
            action.start.x, action.start.y,
            action.end.x - action.start.x,
            action.end.y - action.start.y
          );
        }
      });
    }

    // Mouse events
    canvas.addEventListener("mousedown", e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
    
      drawing = true;
      if (mode === "pen") {
        actions.push({ type: "pen", color: drawColor, points: [{ x, y }] });
      } else if (mode === "rect") {
        startX = x;
        startY = y;
        tempRect = { start: { x, y }, end: { x, y }, color: drawColor };
      }
    });

    canvas.addEventListener("mousemove", e => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
    
      if (mode === "pen") {
        const action = actions[actions.length - 1];
        action.points.push({ x, y });
        redraw();
      } else if (mode === "rect") {
        tempRect.end = { x, y };
        redraw();
        ctx.strokeStyle = drawColor;
        ctx.strokeRect(
          tempRect.start.x, tempRect.start.y,
          tempRect.end.x - tempRect.start.x,
          tempRect.end.y - tempRect.start.y
        );
      }
    });
    
    canvas.addEventListener("mouseup", () => {
      if (drawing && mode === "rect" && tempRect) {
        actions.push({ type: "rect", color: drawColor, start: tempRect.start, end: tempRect.end });
        tempRect = null;
      }
      drawing = false;
    });

    // Toolbar actions
    toolbar.querySelector("#modePen").onclick = () => { mode = "pen"; canvas.style.cursor = "crosshair"; };
    toolbar.querySelector("#modeRect").onclick = () => { mode = "rect"; canvas.style.cursor = "crosshair"; };
    toolbar.querySelector("#colorPicker").oninput = e => { drawColor = e.target.value; };
    toolbar.querySelector("#undoBtn").onclick = () => { actions.pop(); redraw(); };

    // Form
    const form = document.createElement("div");
    form.innerHTML = `
      <input type="text" id="bugTitle" placeholder="Bug title" style="width:90%;margin:10px;padding:8px;"/>
      <textarea id="bugDescription" placeholder="Describe the issue..." style="width:90%;height:80px;margin:10px;padding:8px;"></textarea>
      <div style="margin-top:10px;">
        <button id="sendBug" style="background:#28a745;color:#fff;padding:10px 15px;border:none;border-radius:5px;">Send</button>
        <button id="cancelBug" style="margin-left:10px;padding:10px 15px;">Cancel</button>
      </div>
    `;
    form.style = "display:flex;flex-direction:column;align-items:center;";

    modal.appendChild(toolbar);
    modal.appendChild(canvas);
    modal.appendChild(form);
    document.body.appendChild(modal);

    document.getElementById("cancelBug").onclick = () => modal.remove();

    document.getElementById("sendBug").onclick = () => {
      const title = modal.querySelector("#bugTitle").value;
      const description = modal.querySelector("#bugDescription").value;
      const finalImage = canvas.toDataURL("image/png");

      const env = {
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        pageUrl: window.location.href
      };

      const body = { title, description, environment: env, screenshot: finalImage };
      console.dir(body);
      modal.remove();
      /*
      fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, screenshot: finalImage, environment: env })
      }).then(() => {
        alert("Bug report sent!");
        modal.remove();
      });
      */
    };
  }

  // === BUTTON CLICK: TAKE SCREENSHOT ===
  btn.addEventListener("click", async () => {
    await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
    html2canvas(document.body).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");
      createModal(imageData);
    });
  });
})();

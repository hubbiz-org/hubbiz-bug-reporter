// bug-widget.js
(async () => {
  // === LOAD TAILWIND CSS CDN ===
  function loadTailwind() {
    return new Promise((resolve) => {
      if (document.getElementById("tailwind-cdn")) {
        resolve();
        return;
      }
      const tailwindScript = document.createElement("script");
      tailwindScript.id = "tailwind-cdn";
      tailwindScript.src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";
      tailwindScript.onload = () => resolve();
      tailwindScript.onerror = () => {
        console.warn("Failed to load Tailwind runtime");
        resolve();
      }
      document.head.appendChild(tailwindScript);
    });
  }
  console.log('start loading tw css')
  await loadTailwind();
  console.log('finished loading tw css')
  
  // === CONFIG FROM SCRIPT TAG ===
  const scriptTag = document.getElementById("hubbiz-bug-reporter-script);
  const btnColor = scriptTag.getAttribute("colorBtn") || "#ff5722";
  const btnTextColor = scriptTag.getAttribute("colorBtnText") || "#fff";
  const btnText = scriptTag.getAttribute("btnText") || "Report a Bug";
  const btnPosition = scriptTag.getAttribute("btnPosition") || "bottom-right";
  const apiEndpoint = scriptTag.getAttribute("apiEndpoint") || "https://httpbin.org/post";

   

  // === FLOATING BUTTON ===
  const btn = document.createElement("button");
  btn.className = "fixed px-4 py-2 rounded-md shadow-lg font-semibold focus:outline-none transition";
  btn.style.backgroundColor = btnColor;
  btn.style.color = btnTextColor;
  btn.style.zIndex = 99999;
  btn.style[btnPosition.includes("bottom") ? "bottom" : "top"] = "1.25rem";
  btn.style[btnPosition.includes("right") ? "right" : "left"] = "1.25rem";
  btn.style.cursor = "pointer";
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
    modal.className = "fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-[100000] p-4";

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "mb-3 bg-white rounded-md px-4 py-2 flex items-center space-x-2 shadow";
    toolbar.innerHTML = `
      <button id="modePen" class="px-3 py-1 rounded border border-gray-300 hover:bg-indigo-600 hover:text-white transition">Pen</button>
      <button id="modeRect" class="px-3 py-1 rounded border border-gray-300 hover:bg-indigo-600 hover:text-white transition">Rectangle</button>
      <input type="color" id="colorPicker" value="#ef4444" class="w-10 h-8 cursor-pointer rounded border border-gray-300" />
      <button id="undoBtn" class="px-3 py-1 rounded border border-gray-300 hover:bg-red-600 hover:text-white transition">Undo</button>
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
    canvas.className = "border-2 border-gray-300 rounded max-w-full max-h-[60vh] cursor-crosshair shadow-md";

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
    toolbar.querySelector("#modePen").onclick = () => {
      mode = "pen";
      canvas.style.cursor = "crosshair";
      toolbar.querySelector("#modePen").classList.add("bg-indigo-600", "text-white");
      toolbar.querySelector("#modeRect").classList.remove("bg-indigo-600", "text-white");
    };
    toolbar.querySelector("#modeRect").onclick = () => {
      mode = "rect";
      canvas.style.cursor = "crosshair";
      toolbar.querySelector("#modeRect").classList.add("bg-indigo-600", "text-white");
      toolbar.querySelector("#modePen").classList.remove("bg-indigo-600", "text-white");
    };
    toolbar.querySelector("#colorPicker").oninput = e => { drawColor = e.target.value; };
    toolbar.querySelector("#undoBtn").onclick = () => { actions.pop(); redraw(); };

    toolbar.querySelector("#modePen").classList.add("bg-indigo-600", "text-white");

    // Form
    const form = document.createElement("div");
    form.className = "bg-white rounded-md p-4 w-full max-w-xl mt-4 shadow flex flex-col space-y-3";
    form.innerHTML = `
      <input type="text" id="bugTitle" placeholder="Bug title" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      <textarea id="bugDescription" placeholder="Describe the issue..." rows="4" class="w-full px-3 py-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
      <div class="flex justify-end space-x-3">
        <button id="cancelBug" class="px-4 py-2 border rounded border-gray-400 hover:bg-gray-100 transition">Cancel</button>
        <button id="sendBug" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Send</button>
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

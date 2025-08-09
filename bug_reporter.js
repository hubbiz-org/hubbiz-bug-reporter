(function () {
  const scriptTag = document.currentScript;
  const btnColor = scriptTag.getAttribute("colorBtn") || "#ff5722";
  const btnTextColor = scriptTag.getAttribute("colorBtnText") || "#fff";
  const btnText = scriptTag.getAttribute("btnText") || "Report a Bug";
  const btnPosition = scriptTag.getAttribute("btnPosition") || "bottom-right";
  const apiEndpoint = scriptTag.getAttribute("apiEndpoint");

  // Create floating button
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

  // Load external script helper
  function loadScript(url) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  // Modal creator
  function createModal(imageData) {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.6)";
    modal.style.zIndex = 100000;
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;

    canvas.style.border = "2px solid #ccc";
    canvas.style.maxWidth = "90%";
    canvas.style.maxHeight = "70%";

    // Simple pen annotation
    let drawing = false;
    canvas.addEventListener("mousedown", () => {
      drawing = true;
      ctx.beginPath();
    });
    canvas.addEventListener("mouseup", () => (drawing = false));
    canvas.addEventListener("mousemove", (e) => {
      if (drawing) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "red";
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      }
    });

    // Form inputs
    const form = document.createElement("div");
    form.innerHTML = `
      <input type="text" placeholder="Bug title" style="width:90%;margin:10px;padding:8px;" />
      <textarea placeholder="Describe the issue..." style="width:90%;height:80px;margin:10px;padding:8px;"></textarea>
      <div style="margin-top:10px;">
        <button id="sendBug" style="background:#28a745;color:#fff;padding:10px 15px;border:none;border-radius:5px;">Send</button>
        <button id="cancelBug" style="margin-left:10px;padding:10px 15px;">Cancel</button>
      </div>
    `;
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.alignItems = "center";

    modal.appendChild(canvas);
    modal.appendChild(form);
    document.body.appendChild(modal);

    document.getElementById("cancelBug").onclick = () => modal.remove();

    document.getElementById("sendBug").onclick = () => {
      const title = modal.querySelector("input").value;
      const description = modal.querySelector("textarea").value;
      const finalImage = canvas.toDataURL("image/png");

      // Gather environment info
      const env = {
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        pageUrl: window.location.href
      };

      fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          screenshot: finalImage,
          environment: env
        })
      }).then(() => {
        alert("Bug report sent!");
        modal.remove();
      });
    };
  }

  // Button click: capture screenshot
  btn.addEventListener("click", async () => {
    await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
    html2canvas(document.body).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");
      createModal(imageData);
    });
  });
})();

(function () {
  const input = document.getElementById("world-input");
  const chooseButton = document.getElementById("choose-button");
  const fileLabel = document.getElementById("file-label");
  const statusPanel = document.getElementById("scan-status");
  const statusTitle = document.getElementById("status-title");
  const statusMessage = document.getElementById("status-message");
  const resultsSection = document.getElementById("results-section");
  const emptyState = document.getElementById("empty-state");
  const list = document.getElementById("structure-list");
  const count = document.getElementById("result-count");
  const selectedCount = document.getElementById("selected-count");
  const exportButton = document.getElementById("export-button");
  const selectAllButton = document.getElementById("select-all");
  const searchInput = document.getElementById("search-input");
  let structures = [];
  let selected = new Set();

  function setStatus(title, message, type) {
    statusTitle.textContent = title;
    statusMessage.textContent = message;
    statusPanel.className = "status-panel" + (type ? " " + type : "");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function updateSelection() {
    const visible = Array.from(list.querySelectorAll("input[type=checkbox]"));
    let visibleSelected = 0;
    visible.forEach(function (checkbox) {
      checkbox.checked = selected.has(checkbox.value);
      if (checkbox.checked) visibleSelected++;
    });
    selectedCount.textContent = selected.size + " selected";
    exportButton.disabled = selected.size === 0;
    selectAllButton.textContent = visible.length > 0 && visibleSelected === visible.length ? "Clear visible" : "Select visible";
  }

  function renderList() {
    list.replaceChildren();
    const query = searchInput.value.trim().toLocaleLowerCase();
    structures.forEach(function (item) {
      if (query && !item.identifier.toLocaleLowerCase().includes(query)) return;
      const row = document.createElement("label");
      row.className = "structure-row";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = item.identifier;
      checkbox.checked = selected.has(item.identifier);
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) selected.add(item.identifier);
        else selected.delete(item.identifier);
        updateSelection();
      });
      const meta = document.createElement("span");
      meta.className = "structure-meta";
      const name = document.createElement("span");
      name.className = "structure-id";
      name.textContent = item.identifier;
      const size = document.createElement("span");
      size.className = "structure-size";
      size.textContent = formatBytes(item.size);
      meta.append(name, size);
      row.append(checkbox, meta);
      list.append(row);
    });
    updateSelection();
  }

  chooseButton.addEventListener("click", function () { input.click(); });
  input.addEventListener("change", async function () {
    const file = input.files && input.files[0];
    if (!file) return;
    structures = [];
    selected.clear();
    resultsSection.hidden = true;
    emptyState.hidden = true;
    fileLabel.textContent = file.name + " · " + formatBytes(file.size);
    chooseButton.disabled = true;
    setStatus("Reading Bedrock database", "Opening the world archive and scanning saved structure records. Large worlds can take some time.", "");
    try {
      if (!window.MCBEEngine || !window.MCBEEngine.scanWorld) throw new Error("The bundled extraction engine is missing. Rebuild the app assets.");
      structures = await window.MCBEEngine.scanWorld(file);
      count.textContent = String(structures.length);
      if (structures.length === 0) {
        emptyState.hidden = false;
        setStatus("Scan completed", "The database was read, but no saved structure templates were found.", "success");
      } else {
        resultsSection.hidden = false;
        renderList();
        setStatus("Scan completed", structures.length + " saved structure template(s) found.", "success");
      }
    } catch (error) {
      setStatus("Could not scan this world", error && error.message ? error.message : "Unknown extraction error.", "error");
    } finally {
      chooseButton.disabled = false;
      input.value = "";
    }
  });

  searchInput.addEventListener("input", renderList);
  selectAllButton.addEventListener("click", function () {
    const visible = Array.from(list.querySelectorAll("input[type=checkbox]")).map(function (box) { return box.value; });
    const allSelected = visible.length > 0 && visible.every(function (id) { return selected.has(id); });
    visible.forEach(function (id) { if (allSelected) selected.delete(id); else selected.add(id); });
    renderList();
  });

  function saveThroughAndroid(fileName, bytes) {
    const bridge = window.AndroidBridge;
    if (!bridge) {
      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      return;
    }
    if (!bridge.beginExport(fileName)) throw new Error("Android could not start the export.");
    const chunkSize = 192 * 1024;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
      let binary = "";
      for (let i = 0; i < chunk.length; i++) binary += String.fromCharCode(chunk[i]);
      if (!bridge.appendExportChunk(btoa(binary))) throw new Error("Android could not write the export.");
    }
    if (!bridge.finishExport()) throw new Error("Android could not finish the export.");
  }

  exportButton.addEventListener("click", async function () {
    const ids = Array.from(selected);
    if (!ids.length) return;
    exportButton.disabled = true;
    setStatus("Preparing export", "Copying the original structure data into the selected output format.", "");
    try {
      const result = await window.MCBEEngine.prepareExport(ids);
      saveThroughAndroid(result.fileName, result.bytes);
      setStatus("Export prepared", "Choose where Android should save " + result.fileName + ".", "success");
    } catch (error) {
      if (window.AndroidBridge) window.AndroidBridge.cancelExport();
      setStatus("Export failed", error && error.message ? error.message : "Unknown export error.", "error");
    } finally {
      exportButton.disabled = selected.size === 0;
    }
  });

  window.onNativeExportComplete = function (success, message) {
    setStatus(success ? "Export saved" : "Export not saved", message, success ? "success" : "error");
  };
})();

"use strict";

const copyStatus = document.querySelector("#copyStatus");
const copyButtons = document.querySelectorAll("[data-copy-value]");

const copyTextToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const isCopied = document.execCommand("copy");
  textarea.remove();

  if (!isCopied) {
    throw new Error("copy failed");
  }
};

const setCopyStatus = (message) => {
  if (!copyStatus) {
    return;
  }

  copyStatus.textContent = message;

  window.clearTimeout(setCopyStatus.timer);
  setCopyStatus.timer = window.setTimeout(() => {
    copyStatus.textContent = "";
  }, 1800);
};

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copyValue;
    const successMessage = button.dataset.successMessage || "복사했습니다.";

    if (!value) {
      return;
    }

    try {
      await copyTextToClipboard(value);
      setCopyStatus(successMessage);
    } catch {
      setCopyStatus("복사에 실패했습니다. 값을 직접 선택해 주세요.");
    }
  });
});

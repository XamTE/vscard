"use strict";

const copyStatus = document.querySelector("#copyStatus");
const emailLinks = document.querySelectorAll('a.value[href^="mailto:"]');
const phoneLinks = document.querySelectorAll('a.value[href^="tel:"]');
const COPY_STATUS_DURATION = 1800;

const normalizeText = (text) => (text || "").replace(/\s+/g, " ").trim();

const removeQueryString = (value) => value.split("?")[0].trim();

const getEmailFromMailto = (href) => {
  if (!href) {
    return "";
  }

  try {
    const url = new URL(href, window.location.href);

    if (url.protocol !== "mailto:") {
      return "";
    }

    return decodeURIComponent(url.pathname).trim();
  } catch {
    return removeQueryString(href.replace(/^mailto:/i, ""));
  }
};

const getPhoneFromTel = (href) => {
  if (!href) {
    return "";
  }

  try {
    const url = new URL(href, window.location.href);

    if (url.protocol !== "tel:") {
      return "";
    }

    return decodeURIComponent(url.pathname).trim();
  } catch {
    return removeQueryString(href.replace(/^tel:/i, ""));
  }
};

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
  }, COPY_STATUS_DURATION);
};

const handleCopy = async (value, successMessage) => {
  const text = normalizeText(value);

  if (!text) {
    return;
  }

  try {
    await copyTextToClipboard(text);
    setCopyStatus(successMessage);
  } catch {
    setCopyStatus("복사에 실패했습니다. 값을 직접 선택해 주세요.");
  }
};

const bindCopyEvent = (element, getValue, successMessage) => {
  if (!element || element.dataset.copyBound === "true") {
    return;
  }

  element.dataset.copyBound = "true";

  element.addEventListener("click", async (event) => {
    event.preventDefault();

    await handleCopy(getValue(element), successMessage);
  });
};

emailLinks.forEach((link) => {
  bindCopyEvent(
    link,
    (element) => {
      const hrefEmail = getEmailFromMailto(element.getAttribute("href"));
      return hrefEmail || element.textContent;
    },
    "이메일을 복사했습니다."
  );
});

phoneLinks.forEach((link) => {
  bindCopyEvent(
    link,
    (element) => {
      const visiblePhone = normalizeText(element.textContent);
      const hrefPhone = getPhoneFromTel(element.getAttribute("href"));
      return visiblePhone || hrefPhone;
    },
    "전화번호를 복사했습니다."
  );
});

"use strict";

const emailLinks = document.querySelectorAll('a.value[href^="mailto:"]');
const phoneLinks = document.querySelectorAll('a.value[href^="tel:"]');
const COPY_STATUS_DURATION = 1800;
const COPY_STATUS_FADE_DURATION = 160;

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

const clearCopyStatus = (statusElement) => {
  if (!statusElement) {
    return;
  }

  window.clearTimeout(statusElement.copyTimer);
  window.clearTimeout(statusElement.clearTextTimer);
  statusElement.classList.remove("is-visible");
  statusElement.textContent = "";
};

const clearOtherCopyStatuses = (currentStatusElement) => {
  document.querySelectorAll("[data-copy-status]").forEach((statusElement) => {
    if (statusElement !== currentStatusElement) {
      clearCopyStatus(statusElement);
    }
  });
};

const getCopyStatusElement = (element) => {
  return element.closest(".info-text")?.querySelector("[data-copy-status]") || null;
};

const setCopyStatus = (sourceElement, message) => {
  const statusElement = getCopyStatusElement(sourceElement);

  if (!statusElement) {
    return;
  }

  clearOtherCopyStatuses(statusElement);
  window.clearTimeout(statusElement.copyTimer);
  window.clearTimeout(statusElement.clearTextTimer);

  statusElement.textContent = message;
  statusElement.classList.add("is-visible");

  statusElement.copyTimer = window.setTimeout(() => {
    statusElement.classList.remove("is-visible");

    statusElement.clearTextTimer = window.setTimeout(() => {
      statusElement.textContent = "";
    }, COPY_STATUS_FADE_DURATION);
  }, COPY_STATUS_DURATION);
};

const handleCopy = async (sourceElement, value, successMessage) => {
  const text = normalizeText(value);

  if (!text) {
    return;
  }

  try {
    await copyTextToClipboard(text);
    setCopyStatus(sourceElement, successMessage);
  } catch {
    setCopyStatus(sourceElement, "복사 실패");
  }
};

const bindCopyEvent = (element, getValue, successMessage) => {
  if (!element || element.dataset.copyBound === "true") {
    return;
  }

  element.dataset.copyBound = "true";

  element.addEventListener("click", async (event) => {
    event.preventDefault();
    await handleCopy(element, getValue(element), successMessage);
  });
};

emailLinks.forEach((link) => {
  bindCopyEvent(
    link,
    (element) => {
      const hrefEmail = getEmailFromMailto(element.getAttribute("href"));
      return hrefEmail || element.textContent;
    },
    "이메일 복사됨"
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
    "전화번호 복사됨"
  );
});

"use strict";

const copyStatus = document.querySelector("#copyStatus");
const emailLinks = document.querySelectorAll('a[href^="mailto:"]:not(.button)');
const phoneLinks = document.querySelectorAll('a[href^="tel:"]:not(.button)');
const inlineCopyTargets = document.querySelectorAll('.value[data-copy-value]:not(.button)');
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

const bindCopyEvent = (element, getValue, defaultSuccessMessage) => {
  if (!element || element.dataset.copyBound === "true") {
    return;
  }

  element.dataset.copyBound = "true";

  element.addEventListener("click", async (event) => {
    event.preventDefault();

    const value = getValue(element);
    const successMessage = element.dataset.successMessage || defaultSuccessMessage;

    await handleCopy(value, successMessage);
  });
};

const isCopyButton = (element) => {
  const text = normalizeText(element.textContent);
  const label = normalizeText(element.getAttribute("aria-label"));
  const title = normalizeText(element.getAttribute("title"));
  const copyKeywordText = `${text} ${label} ${title}`;
  const isButtonLike = element.matches('button, [role="button"], .button');
  const hasCopyValue = element.hasAttribute("data-copy-value");
  const hasCopyKeyword = /복사|copy/i.test(copyKeywordText);

  return isButtonLike && (hasCopyValue || hasCopyKeyword);
};

const removeDuplicateCopyButtons = () => {
  document
    .querySelectorAll('button, [role="button"], .button')
    .forEach((element) => {
      if (isCopyButton(element)) {
        element.remove();
      }
    });

  document.querySelectorAll(".actions").forEach((actions) => {
    if (!normalizeText(actions.textContent) && actions.children.length === 0) {
      actions.remove();
    }
  });
};

removeDuplicateCopyButtons();

inlineCopyTargets.forEach((target) => {
  bindCopyEvent(
    target,
    (element) => element.dataset.copyValue || element.textContent,
    "복사했습니다."
  );
});

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

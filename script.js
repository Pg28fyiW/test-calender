
'use strict';

const text = document.getElementById('dateText');
const picker = document.getElementById('purchaseDate');
const maskTyped = document.getElementById('maskTyped');
const maskRest = document.getElementById('maskRest');
const error = document.getElementById('dateError');

// 実際に入力した数字だけを管理
const rawParts = ['', '', ''];

// 0: 年、1: 月、2: 日
let activePart = 0;

// 表示済み文字列
let previousDisplay = '';

// フォールバックで二重入力しないためのフラグ
let composing = false;

function localDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

const today = localDate(new Date());
picker.max = today;

// 入力した数字から表示用の数字を作る
function padded(index) {
  if (!rawParts[index]) return '';

  const length = index === 0 ? 4 : 2;
  return rawParts[index].padStart(length, '0');
}

// 実在する日付か確認
function isValidDate(y, m, d) {
  if (
    y < 1 || y > 9999 ||
    m < 1 || m > 12 ||
    d < 1 || d > 31
  ) return false;

  const date = new Date(0);
  date.setFullYear(y, m - 1, d);
  date.setHours(0, 0, 0, 0);

  return date.getFullYear() === y &&
         date.getMonth() === m - 1 &&
         date.getDate() === d;
}

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
  text.setAttribute('aria-invalid', String(!!message));
}

// 画面に表示する文字を組み立てる
function displayValue() {
  const y = padded(0);
  const m = padded(1);
  const d = padded(2);

  if (!y) {
    return { typed: '', rest: '年 / 月 / 日' };
  }

  if (!m) {
    return {
      typed: activePart === 0 ? y : y + ' / ',
      rest: activePart === 0 ? ' / 月 / 日' : '月 / 日'
    };
  }

  if (!d) {
    return {
      typed: activePart <= 1
        ? y + ' / ' + m
        : y + ' / ' + m + ' / ',
      rest: activePart <= 1 ? ' / 日' : '日'
    };
  }

  return {
    typed: `${y} / ${m} / ${d}`,
    rest: ''
  };
}

// 画面を描画
function render() {
  const { typed, rest } = displayValue();

  text.value = typed;
  maskTyped.textContent = typed;
  maskRest.textContent = rest;
  previousDisplay = typed;
}

// カーソルを現在の編集位置に置く
function placeCaret() {
  if (document.activeElement !== text) return;

  const position = [
    Math.min(4, text.value.length),
    Math.min(9, text.value.length),
    Math.min(14, text.value.length)
  ][activePart];

  text.setSelectionRange(position, position);
}

// エラー判定
function validate(showIncomplete = false) {
  if (rawParts.every(v => !v)) {
    picker.value = '';
    showError('');
    return;
  }

  if (!rawParts.every(v => v !== '')) {
    picker.value = '';
    showError(
      showIncomplete ? '正しい日付を入力してください。' : ''
    );
    return;
  }

  const y = Number(rawParts[0]);
  const m = Number(rawParts[1]);
  const d = Number(rawParts[2]);

  if (!isValidDate(y, m, d)) {
    picker.value = '';
    showError('正しい日付を入力してください。');
    return;
  }

  const value = `${padded(0)}-${padded(1)}-${padded(2)}`;
  picker.value = value;

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  if (value > today) {
    showError('指定された日付は選択できません。');
  } else if (value < localDate(twoYearsAgo)) {
    showError(
      '恐れ入りますが、お買い上げ日から2年間より長く経過している場合、本プログラムにはご入会いただけません。'
    );
  } else {
    showError('');
  }
}

function refresh() {
  render();
  validate();
  placeCaret();
}

// 数字を1文字追加
function addDigit(digit) {
  const max = activePart === 0 ? 4 : 2;

  if (rawParts[activePart].length >= max) {
    if (activePart === 2) return;
    activePart++;
  }

  rawParts[activePart] += digit;

  const maxNow = activePart === 0 ? 4 : 2;

  // 年4桁、月2桁で次へ
  if (
    rawParts[activePart].length >= maxNow &&
    activePart < 2
  ) {
    activePart++;
  }
}

// 次の項目へ
function moveNext() {
  if (activePart < 2 && rawParts[activePart]) {
    activePart++;
  }
}

// Backspaceで1文字削除
function eraseDigit() {
  if (rawParts[activePart]) {
    rawParts[activePart] =
      rawParts[activePart].slice(0, -1);
  } else if (activePart > 0) {
    activePart--;
    rawParts[activePart] =
      rawParts[activePart].slice(0, -1);
  }
}

// 入力された文字だけを処理する
function enterText(value) {
  const clean = value.replace(/[^\d/.\-]/g, '');

  // 8桁の年月日をまとめて貼り付け
  if (
    /^\d{8}$/.test(clean) &&
    activePart === 0 &&
    rawParts.every(v => !v)
  ) {
    rawParts[0] = clean.slice(0, 4);
    rawParts[1] = clean.slice(4, 6);
    rawParts[2] = clean.slice(6, 8);
    activePart = 2;
    refresh();
    return;
  }

  for (const ch of clean) {
    if (/\d/.test(ch)) {
      addDigit(ch);
    } else if (/[\/.\-]/.test(ch)) {
      moveNext();
    }
  }

  refresh();
}

// カーソル位置から年・月・日を判断
function partFromCaret(position) {
  if (position <= 4) return 0;
  if (position <= 9) return 1;
  return 2;
}

// 入力を開始する前に処理
text.addEventListener('beforeinput', (event) => {
  if (composing || !event.cancelable) return;

  if (event.inputType === 'insertText') {
    event.preventDefault();
    if (event.data) enterText(event.data);
  } else if (
    event.inputType === 'deleteContentBackward' ||
    event.inputType === 'deleteContentForward'
  ) {
    event.preventDefault();
    eraseDigit();
    refresh();
  }
});

// beforeinputが使用できない入力への対応
text.addEventListener('input', (event) => {
  if (composing || text.value === previousDisplay) return;

  const kind = event.inputType || '';

  if (kind.startsWith('delete')) {
    eraseDigit();
    refresh();
    return;
  }

  if (event.data && kind.startsWith('insert')) {
    enterText(event.data);
    return;
  }

  // 表示文字列との差分から追加文字を取得
  const oldValue = previousDisplay;
  const newValue = text.value;

  let start = 0;

  while (
    start < oldValue.length &&
    start < newValue.length &&
    oldValue[start] === newValue[start]
  ) {
    start++;
  }

  let oldEnd = oldValue.length;
  let newEnd = newValue.length;

  while (
    oldEnd > start &&
    newEnd > start &&
    oldValue[oldEnd - 1] === newValue[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  const inserted = newValue.slice(start, newEnd);

  if (inserted) {
    enterText(inserted);
  } else {
    render();
    placeCaret();
  }
});

// PCの左右キーで項目移動
text.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    activePart = Math.max(0, activePart - 1);
    placeCaret();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    activePart = Math.min(2, activePart + 1);
    placeCaret();
  }
});

// タップした場所の項目を編集
text.addEventListener('click', () => {
  activePart = partFromCaret(
    text.selectionStart ?? text.value.length
  );
  placeCaret();
});

// 貼り付け
text.addEventListener('paste', (event) => {
  event.preventDefault();

  const value = event.clipboardData?.getData('text') || '';

  if (
    text.selectionStart === 0 &&
    text.selectionEnd === text.value.length
  ) {
    rawParts.fill('');
    activePart = 0;
  }

  enterText(value);
});

// 日本語入力中
text.addEventListener('compositionstart', () => {
  composing = true;
});

text.addEventListener('compositionend', (event) => {
  composing = false;
  const value = event.data || '';
  if (value) enterText(value);
  else refresh();
});

// 入力欄を離れたとき
text.addEventListener('blur', () => {
  validate(true);
});

// カレンダーから選択したとき
picker.addEventListener('change', () => {
  const value = picker.value;

  rawParts.fill('');
  activePart = 0;

  if (value) {
    const [y, m, d] = value.split('-');
    rawParts[0] = String(Number(y));
    rawParts[1] = String(Number(m));
    rawParts[2] = String(Number(d));
    activePart = 2;
  }

  refresh();
});

// 初期表示
render();

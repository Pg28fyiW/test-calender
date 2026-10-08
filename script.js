
'use strict';

const picker = document.getElementById('purchaseDate');
const placeholder = document.getElementById('datePlaceholder');
const error = document.getElementById('dateError');
const savedDate = document.getElementById('savedDate');

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const todayDate = formatLocalDate(new Date());
picker.max = todayDate;

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
}

function updateDate() {
  const value = picker.value;

  placeholder.hidden = !!value;

  if (!value) {
    savedDate.textContent = '';
    showError('');
    return;
  }

  savedDate.textContent = `入力日付：${value}`;

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  if (value > todayDate) {
    showError('指定された日付は選択できません。');
  } else if (value < formatLocalDate(twoYearsAgo)) {
    showError(
      '恐れ入りますが、お買い上げ日から2年間より長く経過している場合、本プログラムにはご入会いただけません。'
    );
  } else {
    showError('');
  }
}

picker.addEventListener('input', updateDate);
picker.addEventListener('change', updateDate);

updateDate();

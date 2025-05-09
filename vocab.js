#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.vocab_data.json');

// Bilingual messages
const messages = {
  en: {
    addSuccess: 'Word added successfully!',
    noWords: 'No words found in the vocabulary.',
    listTitle: 'Vocabulary List:',
    quizPrompt: 'What is the meaning of "{word}"?',
    quizCorrect: 'Correct!',
    quizWrong: 'Wrong! The correct meaning is: {meaning}',
    deleteSuccess: 'Word "{word}" deleted.',
    noWordFound: 'Word not found.',
  },
  vi: {
    addSuccess: 'Từ đã được thêm thành công!',
    noWords: 'Không tìm thấy từ nào trong danh sách.',
    listTitle: 'Danh sách từ vựng:',
    quizPrompt: 'Nghĩa của từ "{word}" là gì?',
    quizCorrect: 'Đúng!',
    quizWrong: 'Sai! Nghĩa đúng là: {meaning}',
    deleteSuccess: 'Từ "{word}" đã được xóa.',
    noWordFound: 'Không tìm thấy từ.',
  },
};

async function loadVocab() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveVocab(vocab) {
  await fs.writeFile(DATA_FILE, JSON.stringify(vocab, null, 2));
}

async function addWord(word, viMeaning, enMeaning) {
  const vocab = await loadVocab();
  vocab.push({ word, vi: viMeaning, en: enMeaning });
  await saveVocab(vocab);
  console.log(chalk.green(messages.en.addSuccess));
}

async function listWords(lang) {
  const vocab = await loadVocab();
  if (!vocab.length) {
    console.log(chalk.yellow(messages[lang].noWords));
    return;
  }
  console.log(chalk.blue(messages[lang].listTitle));
  vocab.forEach((item, index) => {
    console.log(`${index + 1}. ${item.word} - ${lang === 'vi' ? item.vi : item.en}`);
  });
}

async function quiz(lang) {
  const vocab = await loadVocab();
  if (!vocab.length) {
    console.log(chalk.yellow(messages[lang].noWords));
    return;
  }
  const randomWord = vocab[Math.floor(Math.random() * vocab.length)];
  const { answer } = await inquirer.prompt([
    {
      type: 'input',
      name: 'answer',
      message: messages[lang].quizPrompt.replace('{word}', randomWord.word),
    },
  ]);
  const correctAnswer = lang === 'vi' ? randomWord.vi : randomWord.en;
  if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
    console.log(chalk.green(messages[lang].quizCorrect));
  } else {
    console.log(chalk.red(messages[lang].quizWrong.replace('{meaning}', correctAnswer)));
  }
}

async function deleteWord(word, lang) {
  let vocab = await loadVocab();
  const initialLength = vocab.length;
  vocab = vocab.filter((item) => item.word.toLowerCase() !== word.toLowerCase());
  if (vocab.length === initialLength) {
    console.log(chalk.yellow(messages[lang].noWordFound));
    return;
  }
  await saveVocab(vocab);
  console.log(chalk.green(messages[lang].deleteSuccess.replace('{word}', word)));
}

program
  .command('add')
  .description('Add a new word (English: Add a new word | Vietnamese: Thêm từ mới)')
  .option('--word <word>', 'The word to add | Từ cần thêm')
  .option('--vi <meaning>', 'Vietnamese meaning | Nghĩa tiếng Việt')
  .option('--en <meaning>', 'English meaning | Nghĩa tiếng Anh')
  .action(async (options) => {
    if (!options.word || !options.vi || !options.en) {
      console.log(chalk.red('Please provide word, Vietnamese meaning, and English meaning.'));
      return;
    }
    await addWord(options.word, options.vi, options.en);
  });

program
  .command('list')
  .description('List all words (English: List all words | Vietnamese: Liệt kê tất cả từ)')
  .option('--lang <lang>', 'Language (en or vi) | Ngôn ngữ (en hoặc vi)', 'en')
  .action((options) => listWords(options.lang));

program
  .command('quiz')
  .description('Start a quiz (English: Start a quiz | Vietnamese: Bắt đầu bài kiểm tra)')
  .option('--lang <lang>', 'Language (en or vi) | Ngôn ngữ (en hoặc vi)', 'en')
  .action((options) => quiz(options.lang));

program
  .command('delete <word>')
  .description('Delete a word (English: Delete a word | Vietnamese: Xóa một từ)')
  .option('--lang <lang>', 'Language (en or vi) | Ngôn ngữ (en hoặc vi)', 'en')
  .action((word, options) => deleteWord(word, options.lang));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

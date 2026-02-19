import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, getAllConfig, clearConfig, isConfigured } from './config.js';
import {
  imageToText,
  imageToLines,
  pdfToText,
  photoToText,
  recognizeReceipt,
  recognizeBusinessCard,
  recognizeForm,
  preprocessBinarize,
  getPageAngle,
} from './api.js';

const program = new Command();

program
  .name('cloudmersive')
  .description('CLI for Cloudmersive OCR API - extract text from images, PDFs, receipts, and more')
  .version('1.0.0');

// ── config ──────────────────────────────────────────────────────────────────

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'Cloudmersive API key')
  .action((opts) => {
    if (opts.apiKey) {
      setConfig('apiKey', opts.apiKey);
      console.log(chalk.green('API key saved.'));
    } else {
      console.log(chalk.yellow('No options provided. Use --api-key KEY'));
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const cfg = getAllConfig();
    if (!cfg.apiKey || cfg.apiKey.trim() === '') {
      console.log(chalk.yellow('No configuration set. Run: cloudmersive config set --api-key YOUR_KEY'));
      return;
    }
    const masked = cfg.apiKey.slice(0, 6) + '••••••••' + cfg.apiKey.slice(-4);
    console.log(chalk.bold('Current configuration:'));
    console.log(`  ${chalk.cyan('apiKey')}: ${masked}`);
  });

configCmd
  .command('clear')
  .description('Clear all configuration')
  .action(() => {
    clearConfig();
    console.log(chalk.green('Configuration cleared.'));
  });

// ── helpers ──────────────────────────────────────────────────────────────────

function checkConfigured() {
  if (!isConfigured()) {
    console.error(chalk.red('Error: API key not set. Run: cloudmersive config set --api-key YOUR_KEY'));
    process.exit(1);
  }
}

function outputResult(data, useJson) {
  if (useJson) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  // Pretty-print common response shapes
  if (typeof data === 'string') {
    console.log(data);
  } else if (data && typeof data.TextResult === 'string') {
    console.log(data.TextResult);
  } else if (data && typeof data.RawText === 'string') {
    console.log(data.RawText);
  } else if (data && Array.isArray(data.Lines)) {
    for (const line of data.Lines) {
      console.log(line.LineText || JSON.stringify(line));
    }
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function runCommand(label, fn, useJson) {
  checkConfigured();
  const spinner = useJson ? null : ora(label).start();
  try {
    const result = await fn();
    if (spinner) spinner.succeed(chalk.green('Done'));
    outputResult(result, useJson);
  } catch (err) {
    if (spinner) spinner.fail(chalk.red('Failed'));
    const msg = err.response
      ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
      : err.message;
    console.error(chalk.red(`Error: ${msg}`));
    process.exit(1);
  }
}

// ── image ────────────────────────────────────────────────────────────────────

const imageCmd = program.command('image').description('Image OCR operations');

imageCmd
  .command('to-text <file>')
  .description('Extract text from an image file')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Extracting text from ${file}...`, () => imageToText(file), opts.json);
  });

imageCmd
  .command('to-lines <file>')
  .description('Extract text with line locations from an image')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Extracting lines from ${file}...`, () => imageToLines(file), opts.json);
  });

// ── pdf ──────────────────────────────────────────────────────────────────────

const pdfCmd = program.command('pdf').description('PDF OCR operations');

pdfCmd
  .command('to-text <file>')
  .description('Extract text from a PDF file')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Extracting text from PDF ${file}...`, () => pdfToText(file), opts.json);
  });

// ── photo ─────────────────────────────────────────────────────────────────────

const photoCmd = program.command('photo').description('Photo recognition operations');

photoCmd
  .command('to-text <file>')
  .description('Extract text from a photo (scene/natural image)')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Extracting text from photo ${file}...`, () => photoToText(file), opts.json);
  });

photoCmd
  .command('recognize-receipt <file>')
  .description('Extract structured data from a receipt photo')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Recognizing receipt in ${file}...`, () => recognizeReceipt(file), opts.json);
  });

photoCmd
  .command('recognize-business-card <file>')
  .description('Extract contact info from a business card photo')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Recognizing business card in ${file}...`, () => recognizeBusinessCard(file), opts.json);
  });

photoCmd
  .command('recognize-form <file>')
  .description('Extract form fields from a form image')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Recognizing form fields in ${file}...`, () => recognizeForm(file), opts.json);
  });

// ── preprocess ────────────────────────────────────────────────────────────────

const preprocessCmd = program.command('preprocess').description('Image preprocessing operations');

preprocessCmd
  .command('binarize <file>')
  .description('Binarize an image to improve OCR accuracy')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Binarizing image ${file}...`, () => preprocessBinarize(file), opts.json);
  });

preprocessCmd
  .command('page-angle <file>')
  .description('Detect the rotation angle of a page in an image')
  .option('--json', 'Output raw JSON response')
  .action(async (file, opts) => {
    await runCommand(`Detecting page angle in ${file}...`, () => getPageAngle(file), opts.json);
  });

// ── parse ─────────────────────────────────────────────────────────────────────

program.parse(process.argv);

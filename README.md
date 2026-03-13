# bextool

`bextool` is a command-line tool for scaffolding browser extension starter projects.

It guides you through choosing a browser target, starter type, and permissions, then generates a ready-to-edit extension structure for Chrome, Firefox, Edge, or Safari.

## Installation

```bash
npm install -g bextool
```

## Usage

```bash
bextool
```

The CLI will prompt you for:

- project name
- description
- initial version
- target browser
- starter type
- permissions

## Generated Project

The generated extension includes:

- browser-specific manifest output
- popup, background, and/or content files depending on starter choice
- placeholder icons
- starter `README.md`
- starter `package.json`

## Local Development

Run the CLI locally from this repository with:

```bash
npm install
npm start
```

## Publish Checklist

Before publishing:

```bash
npm test
npm pack --dry-run
```

## Contributers
```
Abhiraj (Github: Abhiraj35)

Shubham Raj (Github: Shubham-1068)
```

## License

ISC

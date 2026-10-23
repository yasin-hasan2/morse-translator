# MorseFlow 🔊

**A modern English ↔ Morse Code Translator built with HTML, CSS, and Vanilla JavaScript.**

MorseFlow is a lightweight, browser-based translator that converts English text into Morse code and Morse code back into English. It features a modern responsive interface, dark and light themes, and local translation history.

## ✨ Features

- 🔄 **Two-Way Translation:** Convert English to Morse code and Morse code to English.
- ⚡ **Live Translation:** Get results as you type.
- 📋 **Copy Translation:** Copy translated text to your clipboard.
- 🧹 **Clear Input:** Quickly clear your current translation.
- 🕘 **Translation History:** Save and revisit recent translations.
- 🗑️ **History Management:** Delete individual entries or clear all history.
- 🌙 **Dark & Light Mode:** Switch between themes.
- 💾 **Local Storage:** Keep translation history and theme preferences in your browser.
- 📱 **Responsive Design:** Works on desktop, tablet, and mobile screens.
- 🔒 **No Backend Required:** Translation runs directly in your browser.

## 🛠️ Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Browser LocalStorage API
- Clipboard API

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yasin-hasan2/morse-translator.git
```

Replace `yasin-hasan2` with your GitHub username.

### 2. Open the project

```bash
cd morse-translator
```

### 3. Run the application

Open `index.html` directly in your browser, or use the **Live Server** extension in Visual Studio Code.

No installation, build tools, or backend server are required.

## 📖 How to Use

1. Open MorseFlow in your browser.
2. Select **English → Morse** or **Morse → English**.
3. Enter your text in the input field.
4. View the translated result instantly.
5. Copy the result or review your translation history.
6. Switch between dark and light themes as you prefer.

### Example

**English to Morse**

```text
HELLO WORLD
```

Output:

```text
.... . .-.. .-.. --- / .-- --- .-. .-.. -..
```

**Morse to English**

```text
... --- ...
```

Output:

```text
SOS
```

## 📂 Project Structure

```text
morse-translator/
├── index.html    # Application structure
├── style.css     # Styling and responsive layout
├── script.js     # Translation logic and browser storage
└── README.md     # Project documentation
```

## 💾 Data Storage and Privacy

MorseFlow uses your browser's LocalStorage to save translation history and theme preferences.

- Your saved history remains in the same browser until it is cleared or removed.
- Translation is performed locally in the browser.
- The application does not require a personal account or backend server.

**Note:** LocalStorage is browser-specific. Clearing browser site data or using a different browser may remove or hide your saved history.

## 🗺️ Future Improvements

Planned enhancements include:

- 🔊 Morse code audio playback
- 🎯 Interactive Morse code practice mode
- 📥 Export history to TXT and CSV files
- ⚙️ Improved input validation and history management
- 🚀 Additional accessibility and usability improvements

## 🤝 Contributing

Suggestions, bug reports, and contributions are welcome!

1. Fork this repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.

## 📄 License

Choose an appropriate license for your project before publishing one. If you select the MIT License, include the corresponding `LICENSE` file in the repository.

---

**Built with ❤️ using HTML, CSS, and Vanilla JavaScript.**

If you find MorseFlow useful, consider giving the repository a ⭐ on GitHub!

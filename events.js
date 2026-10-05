export function bindKeyboard(handlers) {
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && handlers.isOpen()) {
      handlers.close();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      handlers.open();
    }
  });
}

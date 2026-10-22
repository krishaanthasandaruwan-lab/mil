/**
 * Native text entry over the game canvas. Phaser has no text input of its own, and a real <input>
 * gives players their phone keyboard, autocorrect and paste for free.
 */
export const promptText = (title: string, initial: string, maxLength: number): Promise<string | undefined> =>
  new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:"Russo One",sans-serif';
    overlay.innerHTML = `
      <div style="width:min(86vw,420px);background:#0f1620;border:2px solid #5ff3ff55;border-radius:16px;padding:22px;box-sizing:border-box;color:#e6edf7">
        <div style="font-size:20px;margin-bottom:14px;color:#ffc83d"></div>
        <input maxlength="${maxLength}" style="width:100%;box-sizing:border-box;font:18px 'Rajdhani',sans-serif;font-weight:700;padding:12px 14px;border-radius:10px;border:2px solid #2e9bff;background:#05080c;color:#fff;outline:none">
        <div style="display:flex;gap:12px;margin-top:18px">
          <button data-act="cancel" style="flex:1;padding:12px;border-radius:10px;border:2px solid #ff3b3b;background:#1a0c0f;color:#fff;font:16px 'Russo One',sans-serif">CANCEL</button>
          <button data-act="ok" style="flex:1;padding:12px;border-radius:10px;border:2px solid #3ddc6b;background:#0c1a10;color:#fff;font:16px 'Russo One',sans-serif">SAVE</button>
        </div>
      </div>`;
    const titleEl = overlay.querySelector('div > div') as HTMLDivElement;
    titleEl.textContent = title;
    const input = overlay.querySelector('input') as HTMLInputElement;
    input.value = initial;
    const done = (value: string | undefined): void => {
      overlay.remove();
      resolve(value);
    };
    overlay.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).dataset.act;
      if (act === 'cancel') done(undefined);
      if (act === 'ok') done(input.value.trim() || undefined);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') done(input.value.trim() || undefined);
      if (e.key === 'Escape') done(undefined);
    });
    document.body.appendChild(overlay);
    input.focus();
    input.select();
  });

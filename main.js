import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

let lastSelection = [];

async function gatherTokens() {

  if (!lastSelection.length) {
    console.log("No saved selection");
    return;
  }

  const items = await OBR.scene.items.getItems(
    item => lastSelection.includes(item.id)
  );

  if (!items.length) {
    console.log("No items");
    return;
  }

  const center =
    items[Math.floor(Math.random() * items.length)];

  const baseX = center.position.x;
  const baseY = center.position.y;

  await OBR.scene.items.updateItems(
    lastSelection,
    drafts => {

      let offset = 0;

      for (const item of drafts) {

        item.position.x = baseX;
        item.position.y = baseY - offset;

        offset += 20;
      }

    }
  );

  console.log("Moved!");

}

OBR.onReady(async () => {

  // следим за выделением
  OBR.player.onChange(player => {

    lastSelection = player.selection;

    console.log("Saved selection:", lastSelection);

  });

  // запуск при открытии popup
  gatherTokens();

});

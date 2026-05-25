import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

async function gatherTokens() {

  const selectedIds = await OBR.player.getSelection();

  if (!selectedIds || selectedIds.length === 0) {
    return;
  }

  const items = await OBR.scene.items.getItems(
    item => selectedIds.includes(item.id)
  );

  if (items.length === 0) {
    return;
  }

  // случайный токен = центр
  const centerItem =
    items[Math.floor(Math.random() * items.length)];

  const baseX = centerItem.position.x;
  const baseY = centerItem.position.y;

  await OBR.scene.items.updateItems(
    selectedIds,
    drafts => {

      let offset = 0;

      for (const item of drafts) {

        item.position.x = baseX;
        item.position.y = baseY - offset;

        offset += 20;
      }

    }
  );

}

OBR.onReady(() => {

  OBR.action.onClick(() => {
    gatherTokens();
  });

});

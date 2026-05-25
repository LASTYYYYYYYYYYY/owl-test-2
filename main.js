import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

async function gatherTokens() {

  const selectedIds = await OBR.player.getSelection();

  console.log("Selected:", selectedIds);

  if (!selectedIds.length) {
    return;
  }

  const items = await OBR.scene.items.getItems(
    item => selectedIds.includes(item.id)
  );

  if (!items.length) {
    return;
  }

  const center =
    items[Math.floor(Math.random() * items.length)];

  const baseX = center.position.x;
  const baseY = center.position.y;

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

  gatherTokens();

});

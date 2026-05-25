import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

async function gatherTokens() {

  const allItems = await OBR.scene.items.getItems();

  const selectedItems = allItems.filter(
    item => item.selected
  );

  if (selectedItems.length === 0) {
    console.log("Nothing selected");
    return;
  }

  const center =
    selectedItems[
      Math.floor(Math.random() * selectedItems.length)
    ];

  const baseX = center.position.x;
  const baseY = center.position.y;

  await OBR.scene.items.updateItems(
    selectedItems.map(i => i.id),
    drafts => {

      let offset = 0;

      for (const item of drafts) {

        item.position.x = baseX;
        item.position.y = baseY - offset;

        offset += 20;
      }

    }
  );

  console.log("Gathered!");

}

OBR.onReady(() => {

  gatherTokens();

});

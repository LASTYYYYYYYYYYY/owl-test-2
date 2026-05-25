import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

async function gatherTokens() {

  const selectedIds = await OBR.player.getSelection();

  if (selectedIds.length === 0) {
    return;
  }

  const items = await OBR.scene.items.getItems(selectedIds);

  if (items.length === 0) {
    return;
  }

  let centerX = 0;
  let centerY = 0;

  for (const item of items) {
    centerX += item.position.x;
    centerY += item.position.y;
  }

  centerX /= items.length;
  centerY /= items.length;

  await OBR.scene.items.updateItems(
    selectedIds,
    (items) => {
      for (const item of items) {
        item.position.x = centerX;
        item.position.y = centerY;
      }
    }
  );

}

OBR.onReady(() => {

  const button = document.getElementById("gather");

  button.addEventListener("click", async () => {
    await gatherTokens();
  });

});

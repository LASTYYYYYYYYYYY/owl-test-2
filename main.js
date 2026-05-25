import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

OBR.onReady(() => {

  const button = document.getElementById("gather");

  button.addEventListener("click", async () => {

    const selection = await OBR.player.getSelection();

    console.log(selection);

    if (selection.length === 0) {
      console.log("nothing selected");
      return;
    }

    const items = await OBR.scene.items.getItems(selection);

    console.log(items);

    if (items.length === 0) {
      console.log("no items");
      return;
    }

    const center =
      items[Math.floor(Math.random() * items.length)];

    let offset = 0;

    await OBR.scene.items.updateItems(
      items,
      (drafts) => {

        for (const item of drafts) {

          item.position.x = center.position.x;
          item.position.y = center.position.y - offset;

          offset += 20;
        }

      }
    );

    console.log("DONE");

  });

});

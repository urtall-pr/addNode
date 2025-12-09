import {
  _decorator,
  Button,
  Component,
  EventTouch,
  Input,
  instantiate,
  Label,
  Node,
  view,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("UIAction")
export class UIAction extends Component {
  @property({ type: Node })
  treeRoot: Node | null = null;

  @property({ type: Node })
  nodePrefab: Node | null = null;

  @property({ type: Node })
  visualizerNode: Node | null = null;

  start() {
    if (!this.treeRoot) return;

    // const rootController = this.treeRoot.getComponent("NodeController");

    this.setupUI();
  }

  setupUI() {
    const { height } = view.getVisibleSize();
    const posY = height / 2 - 30;
    this.createButton("Add Child", () => this.addRandomChild(), -150, posY);
    this.createButton(
      "Remove Random",
      () => this.removeRandomChild(),
      100,
      posY
    );
    this.createButton("Clear Tree", () => this.clearTree(), 350, posY);
  }

  createButton(text: string, callback: () => void, x: number, y: number) {
    const buttonNode = new Node("Button");
    const button = buttonNode.addComponent(Button);
    const label = buttonNode.addComponent(Label);

    label.string = text;
    label.fontSize = 24;
    label.lineHeight = 40;

    button.transition = Button.Transition.SCALE;
    button.zoomScale = 1.0;
    button.duration = 0.1;

    label.lineHeight = 100;
    label.fontSize = 36;

    // button.node.on(Node.EventType.TOUCH_START, callback);
    button.node.on(
      Input.EventType.TOUCH_START,
      (event: EventTouch) => {
        buttonNode.setScale(0.95, 0.95);
        callback();
        event.propagationStopped = true;
      },
      this
    );

    buttonNode.parent = this.node;
    buttonNode.setPosition(x, y);
  }

  addRandomChild() {
    if (!this.treeRoot || !this.nodePrefab) return;

    const rootController = this.treeRoot.getComponent("NodeController");
    if (!rootController) return;

    const newNode = instantiate(this.nodePrefab);
    newNode.parent = this.treeRoot;

    let newController = newNode.getComponent("NodeController");
    if (!newController) {
      newController = newNode.addComponent("NodeController");
    }

    // Выбираем случайного родителя
    const allControllers: any[] = [];
    try {
      if (rootController.each && typeof rootController.each === "function") {
        rootController.each((node: any) => {
          if (allControllers.length < 50) {
            allControllers.push(node);
          }
        });
      }
    } catch (error) {
      console.error("Error traversing tree:", error);
    }

    const randomParent =
      allControllers[Math.floor(Math.random() * allControllers.length)];
    randomParent.add(newController);

    this.refreshVisualizer();
  }

  removeRandomChild() {
    if (!this.treeRoot) return;

    const rootController = this.treeRoot.getComponent("NodeController");
    if (!rootController) return;

    const allControllers: any[] = [];
    rootController.each((node: any) => {
      allControllers.push(node);
    });

    if (allControllers.length > 0) {
      const randomNode =
        allControllers[Math.floor(Math.random() * allControllers.length)];
      const parent = randomNode.parent;
      if (parent) {
        parent.remove(randomNode);
        randomNode.node.destroy();
        this.refreshVisualizer();
      }
    }
  }

  clearTree() {
    if (!this.treeRoot) return;

    const rootController = this.treeRoot.getComponent("NodeController");
    if (!rootController) return;

    rootController.clear();
    this.refreshVisualizer();
  }

  refreshVisualizer() {
    if (this.visualizerNode) {
      const visualizer = this.visualizerNode.getComponent("TreeVisualizer");
      if (visualizer && visualizer.refresh) {
        visualizer.refresh();
      }
    }
  }
}

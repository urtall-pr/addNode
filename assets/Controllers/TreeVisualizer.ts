import { _decorator, Color, Component, Graphics, Label, Node, view } from "cc";
const { ccclass, property } = _decorator;

@ccclass("TreeVisualizer")
export class TreeVisualizer extends Component {
  @property({ type: Node })
  rootNode: Node | null = null;

  @property
  nodeRadius: number = 40; // размер

  @property
  horizontalSpacing: number = 150; //  расстояние

  @property
  verticalSpacing: number = 120; //  расстояние

  private nodeColor: Color = Color.GREEN;
  private lineColor: Color = Color.WHITE;
  private textColor: Color = Color.WHITE;

  private graphics: Graphics | null = null;
  private labels: Label[] = [];

  onLoad() {
    this.graphics = this.getComponent(Graphics);
    if (!this.graphics) {
      this.graphics = this.addComponent(Graphics);
      console.log("Added Graphics component");
    }

    this.graphics.node.active = true;

    this.scheduleOnce(() => {
      this.drawTree();
    }, 0.5);
  }

  drawTree(): void {
    if (!this.graphics || !this.rootNode) {
      console.error("Missing graphics or rootNode");
      return;
    }
    // Очищаем предыдущие лейблы
    this.clearLabels();

    // Очищаем графику
    this.graphics.clear();

    const rootController = this.rootNode.getComponent("NodeController");
    if (!rootController) {
      console.error("No NodeController on root");
      return;
    }

    // console.log("Root controller:", rootController);
    // console.log("Root children count:", rootController.count);

    const screenSize = view.getVisibleSize();
    const centerX = 0;
    const centerY = screenSize.height * 0.5 - 80;

    // console.log(`Screen size: ${screenSize.width}x${screenSize.height}`);
    // console.log(`Drawing center: (${centerX}, ${centerY})`);

    // Рисуем дерево
    this.drawNode(rootController, centerX, centerY, 0);
  }

  private drawNode(controller: any, x: number, y: number, depth: number): void {
    if (!this.graphics) return;

    // console.log(
    //   `Drawing node: depth=${depth}, pos=(${x}, ${y}), children=${controller.count}`
    // );

    // Цвет узла в зависимости от глубины
    const nodeColor = this.getNodeColor(depth);

    // Рисуем узел - квадрат для лучшей видимости
    this.graphics.fillColor = nodeColor;
    this.graphics.roundRect(
      x - this.nodeRadius,
      y - this.nodeRadius,
      this.nodeRadius * 2,
      this.nodeRadius * 2,
      10
    );
    this.graphics.fill();

    // Обводка узла
    this.graphics.strokeColor = Color.BLACK;
    this.graphics.lineWidth = 3;
    this.graphics.roundRect(
      x - this.nodeRadius,
      y - this.nodeRadius,
      this.nodeRadius * 2,
      this.nodeRadius * 2,
      10
    );
    this.graphics.stroke();

    // Создаем текст внутри узла
    this.createNodeLabel(`${controller.count}`, x, y, depth);

    // Получаем детей
    let children: any[] = [];
    if (
      controller.getChildren &&
      typeof controller.getChildren === "function"
    ) {
      try {
        children = controller.getChildren();
        // console.log(
        //   `Found ${children.length} children for node at depth ${depth}`
        // );
      } catch (e) {
        console.error("Error getting children:", e);
      }
    }

    if (children.length > 0) {
      // Вычисляем общую ширину ряда детей
      const totalWidth =
        children.length * (this.nodeRadius * 2 + this.horizontalSpacing) -
        this.horizontalSpacing;
      const startX = x - totalWidth / 2;

      children.forEach((child: any, index: number) => {
        if (!child) {
          console.warn(`Child at index ${index} is null/undefined`);
          return;
        }

        const childX =
          startX + index * (this.nodeRadius * 2 + this.horizontalSpacing);
        const childY = y - this.verticalSpacing; // Дети ниже родителя

        // console.log(`  Child ${index}: pos=(${childX}, ${childY})`);

        // Рисуем соединение
        this.drawConnection(
          x,
          y - this.nodeRadius,
          childX,
          childY + this.nodeRadius
        );

        // Рекурсивно рисуем ребенка
        this.drawNode(child, childX, childY, depth + 1);
      });
    }
  }

  private getNodeColor(depth: number): Color {
    const colors = [
      new Color(66, 135, 245, 255), // Ярко-синий
      new Color(76, 217, 100, 255), // Ярко-зеленый
      new Color(255, 149, 0, 255), // Ярко-оранжевый
      new Color(255, 59, 48, 255), // Ярко-красный
      new Color(175, 82, 222, 255), // Фиолетовый
      new Color(255, 204, 0, 255), // Желтый
    ];

    return colors[depth % colors.length] || colors[0];
  }

  private createNodeLabel(
    text: string,
    x: number,
    y: number,
    depth: number
  ): void {
    // Создаем ноду для лейбла
    const labelNode = new Node(`NodeLabel_${text}_${depth}`);
    const label = labelNode.addComponent(Label);

    label.string = text;
    label.fontSize = 24;
    label.color = this.textColor;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.lineHeight = 30;

    label.isBold = true;

    labelNode.parent = this.node;
    labelNode.setPosition(x, y);

    // Сохраняем для очистки
    this.labels.push(label);

    // console.log(`Label created: "${text}" at (${x}, ${y})`);
  }

  private drawConnection(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): void {
    if (!this.graphics) return;

    // Толстая линия соединения
    this.graphics.strokeColor = this.lineColor;
    this.graphics.lineWidth = 4;
    this.graphics.moveTo(fromX, fromY);
    this.graphics.lineTo(toX, toY);
    this.graphics.stroke();

    // Маленький кружок в начале линии
    this.graphics.fillColor = this.lineColor;
    this.graphics.circle(fromX, fromY, 4);
    this.graphics.fill();

    // Стрелка в конце линии
    this.drawArrow(toX, toY, fromX, fromY);
  }

  private drawArrow(x: number, y: number, fromX: number, fromY: number): void {
    if (!this.graphics) return;

    const arrowSize = 12;
    const angle = Math.atan2(y - fromY, x - fromX);

    // Вычисляем точки стрелки
    const x1 = x - arrowSize * Math.cos(angle - Math.PI / 6);
    const y1 = y - arrowSize * Math.sin(angle - Math.PI / 6);

    const x2 = x - arrowSize * Math.cos(angle + Math.PI / 6);
    const y2 = y - arrowSize * Math.sin(angle + Math.PI / 6);

    // Рисуем стрелку
    this.graphics.fillColor = this.lineColor;
    this.graphics.moveTo(x, y);
    this.graphics.lineTo(x1, y1);
    this.graphics.lineTo(x2, y2);
    this.graphics.close();
    this.graphics.fill();
  }

  private clearLabels(): void {
    // Удаляем все созданные лейблы
    for (const label of this.labels) {
      if (label && label.node) {
        label.node.destroy();
      }
    }
    this.labels = [];
  }

  refresh() {
    // console.log("Refreshing tree visualization...");
    this.drawTree();
  }

  update() {}

  onDestroy() {
    this.clearLabels();
  }
}

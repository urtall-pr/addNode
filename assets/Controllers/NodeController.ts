import { _decorator, Component } from "cc";
const { ccclass, property } = _decorator;

export interface INode {
  root: INode | null;
  parent: INode | null;
  prev: INode | null;
  next: INode | null;
  first: INode | null;
  last: INode | null;
  count: number;
  add(node: INode): void;
  remove(node: INode): void;
  each(cb: (node: INode) => void): void;
}

@ccclass("NodeController")
export class NodeController extends Component implements INode {
  @property({ type: NodeController, visible: false })
  private _parent: NodeController | null = null;

  @property({ type: NodeController, visible: false })
  private _prev: NodeController | null = null;

  @property({ type: NodeController, visible: false })
  private _next: NodeController | null = null;

  @property({ type: NodeController, visible: false })
  private _first: NodeController | null = null;

  @property({ type: NodeController, visible: false })
  private _last: NodeController | null = null;

  private _children: NodeController[] = [];
  private _visited: boolean = false; // Для предотвращения циклов

  // Getters для интерфейса
  get root(): INode | null {
    let current: NodeController | null = this;
    const visited = new Set<NodeController>();

    while (current && current.parent) {
      if (visited.has(current)) {
        console.error("Cyclic reference detected in root chain!");
        return null;
      }
      visited.add(current);
      current = current.parent as NodeController;
    }
    return current;
  }

  get parent(): INode | null {
    return this._parent;
  }

  get prev(): INode | null {
    return this._prev;
  }

  get next(): INode | null {
    return this._next;
  }

  get first(): INode | null {
    return this._first;
  }

  get last(): INode | null {
    return this._last;
  }

  get count(): number {
    return this._children.length;
  }

  onLoad() {
    this.setupSiblingLinks();
  }

  private setupSiblingLinks(): void {
    if (!this._parent) return;

    const parentController = this._parent as NodeController;
    const children = parentController._children;
    const index = children.indexOf(this);

    if (index > 0) {
      this._prev = children[index - 1];
      (this._prev as NodeController)._next = this;
    }

    if (index < children.length - 1) {
      this._next = children[index + 1];
    }
  }

  onClick() {
    this.add(this);
  }

  add(node: INode): void {
    const childController = node as NodeController;

    if (childController === this) {
      console.error("Cannot add node to itself!");
      return;
    }

    // Проверка на циклические ссылки
    if (this.isAncestorOf(childController)) {
      console.error("Cyclic reference detected! Cannot add ancestor as child.");
      return;
    }

    if (childController._parent === this) {
      console.warn("Node already added");
      return;
    }

    // Удаляем из предыдущего родителя
    if (childController._parent) {
      childController._parent.remove(childController);
    }

    // Добавляем в children
    this._children.push(childController);
    childController._parent = this;

    // Обновляем first/last
    this.updateFirstLast();

    // Настраиваем связи между соседями
    this.updateSiblingLinks();

    if (childController.node && this.node) {
      childController.node.parent = this.node;
    }
  }

  remove(node: INode): void {
    const childController = node as NodeController;
    const index = this._children.indexOf(childController);

    if (index === -1) {
      console.warn("Node not found in children");
      return;
    }

    // Обновляем соседние связи
    if (childController._prev) {
      (childController._prev as NodeController)._next = childController._next;
    }

    if (childController._next) {
      (childController._next as NodeController)._prev = childController._prev;
    }

    // Удаляем из массива
    this._children.splice(index, 1);
    childController._parent = null;
    childController._prev = null;
    childController._next = null;

    // Обновляем first/last
    this.updateFirstLast();
  }

  private updateSiblingLinks(): void {
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      child._prev = i > 0 ? this._children[i - 1] : null;
      child._next =
        i < this._children.length - 1 ? this._children[i + 1] : null;
    }
  }

  private updateFirstLast(): void {
    if (this._children.length === 0) {
      this._first = null;
      this._last = null;
    } else {
      this._first = this._children[0];
      this._last = this._children[this._children.length - 1];
    }
  }

  each(cb: (node: INode) => void): void {
    const visited = new Set<NodeController>();
    this._eachRecursive(this, cb, visited);
  }

  private _eachRecursive(
    node: NodeController,
    cb: (node: INode) => void,
    visited: Set<NodeController>
  ): void {
    if (visited.has(node)) {
      console.error("Cycle detected in tree traversal!");
      return;
    }

    visited.add(node);
    cb(node);

    for (const child of node._children) {
      this._eachRecursive(child, cb, visited);
    }

    visited.delete(node);
  }

  // Получить всех детей (нерекурсивно)
  getChildren(): NodeController[] {
    return [...this._children];
  }

  // Найти ноду по имени (с ограничением глубины)
  findByName(name: string, maxDepth: number = 10): NodeController | null {
    return this._findByNameRecursive(
      this,
      name,
      maxDepth,
      0,
      new Set<NodeController>()
    );
  }

  private _findByNameRecursive(
    node: NodeController,
    name: string,
    maxDepth: number,
    currentDepth: number,
    visited: Set<NodeController>
  ): NodeController | null {
    if (currentDepth > maxDepth) {
      console.warn("Max depth reached in findByName");
      return null;
    }

    if (visited.has(node)) {
      return null;
    }

    visited.add(node);

    if (node.node.name === name) {
      return node;
    }

    for (const child of node._children) {
      const found = this._findByNameRecursive(
        child,
        name,
        maxDepth,
        currentDepth + 1,
        visited
      );
      if (found) return found;
    }

    return null;
  }

  // Очистить всех детей (без рекурсии)
  clear(): void {
    // Сначала разрываем все связи
    for (const child of this._children) {
      child._parent = null;
      child._prev = null;
      child._next = null;
    }

    // Затем очищаем массив
    this._children.length = 0;
    this.updateFirstLast();
  }

  // Проверить, является ли нода потомком (с защитой от циклов)
  isDescendantOf(node: INode): boolean {
    let current: INode | null = this._parent;
    const visited = new Set<NodeController>();

    while (current) {
      if (visited.has(current as NodeController)) {
        console.error("Cycle detected in parent chain!");
        return false;
      }

      visited.add(current as NodeController);

      if (current === node) return true;
      current = current.parent;
    }
    return false;
  }

  // Проверить, является ли нода предком
  isAncestorOf(node: NodeController): boolean {
    return node.isDescendantOf(this);
  }

  // Получить глубину ноды
  getDepth(): number {
    let depth = 0;
    let current: NodeController | null = this._parent as NodeController;
    const visited = new Set<NodeController>();

    while (current) {
      if (visited.has(current)) {
        console.error("Cycle detected in depth calculation!");
        return depth;
      }
      visited.add(current);
      depth++;
      current = current._parent as NodeController;
    }

    return depth;
  }

  // Получить все ноды (с ограничением)
  getAllNodes(maxNodes: number = 1000): NodeController[] {
    const result: NodeController[] = [];
    const visited = new Set<NodeController>();

    this._collectNodes(this, result, visited, maxNodes);
    return result;
  }

  private _collectNodes(
    node: NodeController,
    result: NodeController[],
    visited: Set<NodeController>,
    maxNodes: number
  ): void {
    if (result.length >= maxNodes || visited.has(node)) {
      return;
    }

    visited.add(node);
    result.push(node);

    for (const child of node._children) {
      this._collectNodes(child, result, visited, maxNodes);
    }
  }
}

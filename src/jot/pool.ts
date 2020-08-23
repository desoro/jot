
interface PoolObject {
  enable: (...args: any[]) => void;
  disable: () => void;
}

class Pool<T extends PoolObject> {
  private type: (new () => T);
  private pool: T[];
  
  /**
   * @param type - Class type that declares both enable() and disable() methods.
   * @param size - The number of instances to preload.
   */
  constructor(type: (new () => T), size: number) {
    this.type = type;
    this.pool = Array(size).fill(new type());
  }

  /**
   * The number of available instances in the pool.
   */
  get available() {
    return this.pool.length;
  }

   /**
   * Retrieves an instance of the class from the pool. The pool will auto grow when empty.
   * @param type - Class type that declares both enable() and disable() methods.
   * @param args - Constructor args that will be passed during init().
   */
  retrieve(...args: any[]): T {
    const obj = this.pool.pop() || new this.type();

    obj.enable(...args);

    return obj as T;
  }

  /**
   * Releases an instance back to its pool.
   * @param instance - The instance to disable() and return to the pool.
   */
  release(instance: T) {
    instance.disable();
    this.pool.push(instance);
  }
}

export { PoolObject };
export default Pool;
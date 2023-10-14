declare module "unicompare" {
  export default function some(rootObj: Object, v: any): boolean;
  export default function objEqual(obj1:Object, obj2:Object, deep?:boolean = false, over?:boolean = false)
}

import TWEEN from "@tweenjs/tween.js";
import {useAddSignal,useDispatchSignal} from "@/hooks/useSignal";

/**
 * @Date 2022-06-16
 * @Author 二三
 * @Description 补间动画管理器
 */
class TweenManger {
  public tweenList = new TWEEN.Group();

  constructor() {
    useAddSignal("editorCleared",()=>{
      this.dispose();
    });
    useAddSignal("tweenAdd",( tween )=>{
      this.addTween( tween );
    });
    useAddSignal("tweenRemove",( tween )=>{
      this.removeTween( tween );
    });
  }

  dispose() {
    this.tweenList.removeAll();
  }

  addTween(tween) {
    this.tweenList.add(tween);
  }

  removeTween(tween) {
    this.tweenList.remove(tween);
  }

  update(needsUpdate:boolean) {
    if (this.tweenList.getAll().length === 0) return;

    this.tweenList.update();

    needsUpdate && useDispatchSignal("sceneGraphChanged")
  }
}
export { TweenManger };

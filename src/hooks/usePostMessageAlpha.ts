import { onMounted, onUnmounted, Ref } from "vue";
import { kernel } from "@orginone/oiocns-ts";
import _ from "lodash";

export default function (iframeRef: Ref<any>, appInfo: any, link: string) {
  onMounted(() => {
    window.addEventListener("message", handleReceiveMsg);
  });

  onUnmounted(() => {
    window.removeEventListener("message", handleReceiveMsg);
  });

  const handleReceiveMsg = async (message: any) => {
    if (!message.data.sendId) {
      return;
    }
    console.log("platform received message", message.data);
    ((msg: any) => {
      setTimeout(async () => {
        let result: any = { sendId: msg.data.sendId, from: "orginone" };
        try {
          let res: any = await execAppRequest(msg.data);
          result = { ...result, ...res };
        } catch (err) {
          result.exception = err;
        } finally {
          const obj = _.cloneDeep(result);
          iframeRef.value.contentWindow.postMessage(obj, link);
        }
      });
    })(message);
  };

  /**
   * 请求处理
   */
  const execAppRequest = async (data: any) => {
    switch (data.url) {
      case "appInfo":
        return { success: true, code: 200, data: appInfo, msg: "成功" };
      case "kernel": {
        let methodName = data.methodName;
        switch (methodName) {
          case "tokenInfo": {
            return {
              success: true,
              code: 200,
              data: {
                user: JSON.parse(sessionStorage.getItem("sessionUser") ?? ""),
                currentSpace: sessionStorage.getItem("sessionSpace"),
              },
            };
          }
          case "request":
            return await kernel.request(data.args);
          case "requests":
            return await kernel.requests(data.args);
          case "resetPassword":
            let args = data.args;
            return await kernel.resetPassword(
              args.userName,
              args.password,
              args.privateKey
            );
          default:
            return {
              success: true,
              code: 404,
              data: appInfo,
              msg: `未定义的接口: ${methodName}`,
            };
        }
      }
      case "anyStore": {
        let args = data.args;
        let methodName = data.methodName;
        switch (methodName) {
          case "Get":
            return await kernel.anystore.get(args.key, args.domain);
          case "Delete":
            return await kernel.anystore.delete(args.key, args.domain);
          case "Set":
            return await kernel.anystore.set(
              args.key,
              args.options,
              args.domain
            );
          case "Insert":
            return await kernel.anystore.insert(
              args.key,
              args.options,
              args.domain
            );
          case "Update":
            return await kernel.anystore.update(
              args.key,
              args.options,
              args.domain
            );
          case "Remove":
            return await kernel.anystore.remove(
              args.key,
              args.options,
              args.domain
            );
          case "Aggregate":
            return await kernel.anystore.aggregate(
              args.key,
              args.options,
              args.domain
            );
          default:
            return {
              success: true,
              code: 404,
              data: appInfo,
              msg: `未定义的接口：${methodName} !`,
            };
        }
      }
    }
  };
}

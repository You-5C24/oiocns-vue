<template>
  <Suspense>
    <template #default>
      <el-config-provider :locale="locale">
        <div class="pages" @contextmenu.prevent>
          <router-view />
        </div>
      </el-config-provider>
    </template>
    <template #fallback> Loading ... </template>
  </Suspense>
</template>

<script lang="ts">
// import 'element-plus/theme-chalk/el-loading.css'
// import 'element-plus/theme-chalk/el-message.css'

import { defineComponent } from 'vue'
import { ElConfigProvider,ElMessage } from 'element-plus'
import zhCn from 'element-plus/lib/locale/lang/zh-cn'
import { logger,LoggerLevel } from '@/ts/coreIndex';
import moment from 'moment'

logger.onLogger = (level:LoggerLevel, msg:any) => {
  switch (level) {
    case LoggerLevel.info:
      ElMessage({
        message: msg,
        type: 'info'
      })
      break;
    case LoggerLevel.warn:
      ElMessage({
        message: msg,
        type: 'warning'
      })
      break;
    case LoggerLevel.error:
      ElMessage({
        message: msg,
        type: 'error'
      })
      break;
    case LoggerLevel.unauth:
        ElMessage({
        message: msg,
        type: 'error'
      })
      // return r.push('/login');
  }
}
export default defineComponent({
  components: {
    ElConfigProvider
  },
  setup() {
    return {
      locale: zhCn
    }
  }
})
</script>

<style lang="scss">
.el-dialog>.el-dialog__header ,.el-drawer >.el-drawer__header {
  background-color: var(--el-fill-color-light) !important;
  margin-right: 0 !important;
}
.el-drawer >.el-drawer__header  {
  padding-bottom: 20px !important;
}
// 文字提示添加customized主题
.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: var(--el-color-primary-light-9);
}

.el-popper.is-customized .el-popper__arrow::before {
  background: var(--el-color-primary-light-9);
  right: 0;
}
</style>

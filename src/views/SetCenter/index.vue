<template>
  <!-- 主体 -->
  <div class="organization-layout-wrap" style="display: flex; height: 100%;">
      <!-- 内容区域home -->
      <router-view />
  </div>
</template>
<script lang="ts" setup>
  // @ts-nocheck
  import { ref, computed } from 'vue'
  import { useUserStore } from '@/store/user'
  import { storeToRefs } from 'pinia'

  const store = useUserStore()
  const router = useRouter()
  const { workspaceData,queryInfo } = storeToRefs(store)

  const isMySpace = ref<boolean>(workspaceData.value.id == queryInfo.value.id)
  // 当前路由
  const currentRouter = computed(()=> router.currentRoute.value.fullPath)
  router.push(currentRouter.value)
</script>

<style lang="scss" scoped>
  .organization-wrap {
    display: flex;
    flex-direction: column;
  }
  .menu-tab {
    width: 140px;
    background-color: var(--el-bg-color-overlay);
    .orgnization-navbar  {
      height: 100%;
    }
  }
  :deep(.el-select) {
    width: 100%;
  }
</style>

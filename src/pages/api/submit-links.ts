import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';

// 标记为服务器渲染端点
export const prerender = false;
  
const CONFIG = {
  notionToken: import.meta.env.NOTION_TOKEN,
  notionLinksDatabaseId: import.meta.env.NOTION_LINKS_DATABASE_ID,
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // 验证必填字段
    if (!data.title || !data.siteurl || !data.imgurl || !data.desc) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '请填写所有必填字段'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证 URL 格式
    try {
      new URL(data.siteurl);
      new URL(data.imgurl);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'URL 格式不正确'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 检查环境变量
    if (!CONFIG.notionToken || !CONFIG.notionLinksDatabaseId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '服务配置错误，请联系管理员'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 初始化 Notion 客户端
    const notion = new Client({ auth: CONFIG.notionToken });
    
    // 创建 Notion 数据库条目
    await notion.pages.create({
      parent: {
        data_source_id: CONFIG.notionLinksDatabaseId,
      },
      properties: {
        Title: {
          title: [{ text: { content: data.title } }]
        },
        Siteurl: {
          url: data.siteurl,
        },
        Imgurl: {
          url: data.imgurl,
        },
        Desc: {
          rich_text: [{ text: { content: data.desc } }],
        },
      },
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '友链申请提交成功！我会尽快处理并添加。'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('提交友链失败:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '提交失败，请稍后重试'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

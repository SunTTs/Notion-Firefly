/**
 * Notion 友链同步脚本
 */

import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import fs from 'fs-extra';
import path from 'path';

// 加载配置
dotenv.config({ path: '.env' });
const CONFIG = {
    notionToken: process.env.NOTION_TOKEN,
    notionLinksDatabaseId: process.env.NOTION_LINKS_DATABASE_ID,
    linksDir: path.join(process.cwd(), 'src/config/friendsLinks.json'),
};

// 验证配置
if (!CONFIG.notionToken || !CONFIG.notionLinksDatabaseId) {
    console.error('❌ 错误: 缺少 NOTION_TOKEN 或 NOTION_LINKS_DATABASE_ID 环境变量');
    process.exit(1);
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('🚀 开始同步Notion友链...');
        // 确保links文件存在
        await fs.ensureFile(CONFIG.linksDir);

        // 初始化Notion客户端
        const notion = new Client({ auth: CONFIG.notionToken });

        // 查询友链数据库
        const response = await notion.dataSources.query({
            data_source_id: CONFIG.notionLinksDatabaseId,
            filter: {
                and: [
                    {
                        property: 'Enabled',
                        checkbox: {
                            equals: true,
                        },
                    },
                    {
                        property: 'Status',
                        status: {
                            equals: "已通过",
                        },
                    },
                ],
            },
            sorts: [
                {
                    property: 'Weight',
                    direction: 'descending',
                },
            ],
        });
        const links = response.results.map((item) => ({
            title: item.properties.Title.title[0].plain_text,
            imgurl: item.properties.Imgurl.url,
            desc: item.properties.Desc.rich_text[0].plain_text,
            siteurl: item.properties.Siteurl.url,
            tags: item.properties.Tags.multi_select.map((tag) => tag.name),
            weight: item.properties.Weight.number,
            enabled: item.properties.Enabled.checkbox,
        }));
        // 写入JSON文件
        await fs.writeJson(CONFIG.linksDir, links, { spaces: 2 });
        console.log(`\n✅ 友链成功同步: ${links.length} 条`);
    } catch (error) {
        console.error('\n❌ 同步失败:', error.message);
        process.exit(1);
    }
}

// 执行主函数
main();

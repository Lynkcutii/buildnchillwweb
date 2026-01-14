
import { test, expect } from '@playwright/test';

test('Verify image upload UI in Admin', async ({ page }) => {
  await page.goto('http://localhost:5173/admin');
  
  // Bypass login
  await page.evaluate(() => {
    sessionStorage.setItem('adminAuth', 'true');
  });
  await page.reload();

  // Check News section
  await page.click('button:has-text("Tin Tức")');
  await page.click('button:has-text("Thêm bài viết")');
  
  const newsFileInput = page.locator('input[type="file"]');
  await expect(newsFileInput).toBeVisible();
  await expect(page.locator('text=Tải ảnh lên (Tối đa 10MB)')).toBeVisible();
  
  await page.click('button:has-text("Hủy bỏ")');

  // Check Categories section
  await page.click('button:has-text("Danh Mục")');
  await page.click('button:has-text("Thêm danh mục")');
  
  const catFileInput = page.locator('input[type="file"]');
  await expect(catFileInput).toBeVisible();
  await expect(page.locator('text=Tải ảnh lên (Tối đa 10MB) hoặc nhập Emoji/Link bên dưới')).toBeVisible();
});

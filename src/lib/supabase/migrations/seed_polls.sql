-- Test Data for Polls
-- Run this in Supabase SQL Editor to populate sample polls

INSERT INTO polls (type, title, description, target, time_window, end_at, status)
VALUES
(
    'direction', 
    'USD/JPY 今後の4時間', 
    '欧州時間のUSD/JPYの方向感を投票しましょう。155円台を維持できるか注目です。', 
    'USDJPY', 
    '4h', 
    NOW() + INTERVAL '4 hours', 
    'active'
),
(
    'indicator', 
    '米CPI 経済指標予測', 
    '来週のCPI発表、市場予想(3.1%)に対してどうなる？', 
    'CPI', 
    'event', 
    NOW() + INTERVAL '3 days', 
    'active'
),
(
    'action', 
    '本日のトレード方針', 
    '重要指標前ですが、トレードしますか？', 
    'ALL', 
    '1d', 
    NOW() + INTERVAL '12 hours', 
    'active'
);

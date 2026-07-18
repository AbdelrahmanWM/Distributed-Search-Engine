#include "LogBuffer.h"
#include <ctime>
#include <iostream>

LogBuffer &LogBuffer::instance()
{
    static LogBuffer buffer;
    return buffer;
}

void LogBuffer::install()
{
    LogBuffer &buffer = instance();
    if (buffer.m_forward == nullptr)
    {
        buffer.m_forward = std::cout.rdbuf(&buffer);
    }
}

int LogBuffer::overflow(int ch)
{
    if (ch == EOF)
    {
        return 0;
    }
    put(static_cast<char>(ch));
    return ch;
}

std::streamsize LogBuffer::xsputn(const char *s, std::streamsize n)
{
    for (std::streamsize i = 0; i < n; i++)
    {
        put(s[i]);
    }
    return n;
}

int LogBuffer::sync()
{
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_forward->pubsync();
}

void LogBuffer::put(char c)
{
    std::lock_guard<std::mutex> lock(m_mutex);
    m_forward->sputc(c);
    if (c == '\n')
    {
        commitLine();
    }
    else if (c != '\r')
    {
        m_current += c;
    }
}

void LogBuffer::commitLine()
{
    if (!m_current.empty())
    {
        std::time_t now = std::time(nullptr);
        char stamp[16] = "";
        std::strftime(stamp, sizeof(stamp), "%H:%M:%S", std::localtime(&now));
        m_lines.push_back({m_nextId++, stamp, m_current});
        if (m_lines.size() > MAX_LINES)
        {
            m_lines.pop_front();
        }
    }
    m_current.clear();
}

std::vector<LogLine> LogBuffer::linesAfter(long afterId)
{
    LogBuffer &buffer = instance();
    std::lock_guard<std::mutex> lock(buffer.m_mutex);
    std::vector<LogLine> result;
    for (const LogLine &line : buffer.m_lines)
    {
        if (line.id > afterId)
        {
            result.push_back(line);
        }
    }
    return result;
}

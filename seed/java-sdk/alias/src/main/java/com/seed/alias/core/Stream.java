/**
 * This file was auto-generated by Fern from our API Definition.
 */
package com.seed.alias.core;

import java.io.Closeable;
import java.io.IOException;
import java.io.Reader;
import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.Scanner;

/**
 * The {@code Stream} class implements {@link Iterable} to provide a simple mechanism for reading and parsing
 * objects of a given type from data streamed via a {@link Reader} using a specified delimiter.
 * <p>
 * {@code Stream} assumes that data is being pushed to the provided {@link Reader} asynchronously and utilizes a
 * {@code Scanner} to block during iteration if the next object is not available.
 * Iterable stream for parsing JSON and Server-Sent Events (SSE) data.
 * Supports both newline-delimited JSON and SSE with optional stream termination.
 *
 * @param <T> The type of objects in the stream.
 */
public final class Stream<T> implements Iterable<T>, Closeable {

    private static final String NEWLINE = "\n";
    private static final String DATA_PREFIX = "data:";

    public enum StreamType {
        JSON,
        SSE
    }

    private final Class<T> valueType;
    private final Scanner scanner;
    private final StreamType streamType;
    private final String messageTerminator;
    private final String streamTerminator;
    private final Reader sseReader;
    private boolean isClosed = false;

    /**
     * Constructs a new {@code Stream} with the specified value type, reader, and delimiter.
     *
     * @param valueType The class of the objects in the stream.
     * @param reader    The reader that provides the streamed data.
     * @param delimiter The delimiter used to separate elements in the stream.
     */
    public Stream(Class<T> valueType, Reader reader, String delimiter) {
        this.valueType = valueType;
        this.scanner = new Scanner(reader).useDelimiter(delimiter);
        this.streamType = StreamType.JSON;
        this.messageTerminator = delimiter;
        this.streamTerminator = null;
        this.sseReader = null;
    }

    private Stream(Class<T> valueType, StreamType type, Reader reader, String terminator) {
        this.valueType = valueType;
        this.streamType = type;
        if (type == StreamType.JSON) {
            this.scanner = new Scanner(reader).useDelimiter(terminator);
            this.messageTerminator = terminator;
            this.streamTerminator = null;
            this.sseReader = null;
        } else {
            this.scanner = null;
            this.messageTerminator = NEWLINE;
            this.streamTerminator = terminator;
            this.sseReader = reader;
        }
    }

    public static <T> Stream<T> fromJson(Class<T> valueType, Reader reader, String delimiter) {
        return new Stream<>(valueType, reader, delimiter);
    }

    public static <T> Stream<T> fromJson(Class<T> valueType, Reader reader) {
        return new Stream<>(valueType, reader, NEWLINE);
    }

    public static <T> Stream<T> fromSse(Class<T> valueType, Reader sseReader) {
        return new Stream<>(valueType, StreamType.SSE, sseReader, null);
    }

    public static <T> Stream<T> fromSse(Class<T> valueType, Reader sseReader, String streamTerminator) {
        return new Stream<>(valueType, StreamType.SSE, sseReader, streamTerminator);
    }

    @Override
    public void close() throws IOException {
        if (!isClosed) {
            isClosed = true;
            if (scanner != null) {
                scanner.close();
            }
            if (sseReader != null) {
                sseReader.close();
            }
        }
    }

    private boolean isStreamClosed() {
        return isClosed;
    }

    /**
     * Returns an iterator over the elements in this stream that blocks during iteration when the next object is
     * not yet available.
     *
     * @return An iterator that can be used to traverse the elements in the stream.
     */
    @Override
    public Iterator<T> iterator() {
        if (streamType == StreamType.SSE) {
            return new SSEIterator();
        } else {
            return new JsonIterator();
        }
    }

    private final class JsonIterator implements Iterator<T> {

        /**
         * Returns {@code true} if there are more elements in the stream.
         * <p>
         * Will block and wait for input if the stream has not ended and the next object is not yet available.
         *
         * @return {@code true} if there are more elements, {@code false} otherwise.
         */
        @Override
        public boolean hasNext() {
            if (isStreamClosed()) {
                return false;
            }
            return scanner.hasNext();
        }

        /**
         * Returns the next element in the stream.
         * <p>
         * Will block and wait for input if the stream has not ended and the next object is not yet available.
         *
         * @return The next element in the stream.
         * @throws NoSuchElementException If there are no more elements in the stream.
         */
        @Override
        public T next() {
            if (isStreamClosed()) {
                throw new NoSuchElementException("Stream is closed");
            }

            if (!scanner.hasNext()) {
                throw new NoSuchElementException();
            } else {
                try {
                    T parsedResponse =
                            ObjectMappers.JSON_MAPPER.readValue(scanner.next().trim(), valueType);
                    return parsedResponse;
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        }

        @Override
        public void remove() {
            throw new UnsupportedOperationException();
        }
    }

    private final class SSEIterator implements Iterator<T> {
        private Scanner sseScanner;
        private T nextItem;
        private boolean hasNextItem = false;
        private boolean endOfStream = false;
        private StringBuilder buffer = new StringBuilder();
        private boolean prefixSeen = false;

        private SSEIterator() {
            if (sseReader != null && !isStreamClosed()) {
                this.sseScanner = new Scanner(sseReader);
            } else {
                this.endOfStream = true;
            }
        }

        @Override
        public boolean hasNext() {
            if (isStreamClosed() || endOfStream) {
                return false;
            }

            if (hasNextItem) {
                return true;
            }

            return readNextMessage();
        }

        @Override
        public T next() {
            if (!hasNext()) {
                throw new NoSuchElementException("No more elements in stream");
            }

            T result = nextItem;
            nextItem = null;
            hasNextItem = false;
            return result;
        }

        @Override
        public void remove() {
            throw new UnsupportedOperationException();
        }

        private boolean readNextMessage() {
            if (sseScanner == null || isStreamClosed()) {
                endOfStream = true;
                return false;
            }

            try {
                while (sseScanner.hasNextLine()) {
                    String chunk = sseScanner.nextLine();
                    buffer.append(chunk).append(NEWLINE);

                    int terminatorIndex;
                    while ((terminatorIndex = buffer.indexOf(messageTerminator)) >= 0) {
                        String line = buffer.substring(0, terminatorIndex + messageTerminator.length());
                        buffer.delete(0, terminatorIndex + messageTerminator.length());

                        line = line.trim();
                        if (line.isEmpty()) {
                            continue;
                        }

                        if (!prefixSeen && line.startsWith(DATA_PREFIX)) {
                            prefixSeen = true;
                            line = line.substring(DATA_PREFIX.length()).trim();
                        } else if (!prefixSeen) {
                            continue;
                        }

                        if (streamTerminator != null && line.contains(streamTerminator)) {
                            endOfStream = true;
                            return false;
                        }

                        try {
                            nextItem = ObjectMappers.JSON_MAPPER.readValue(line, valueType);
                            hasNextItem = true;
                            prefixSeen = false;
                            return true;
                        } catch (Exception parseEx) {
                            continue;
                        }
                    }
                }

                endOfStream = true;
                return false;

            } catch (Exception e) {
                System.err.println("Failed to parse SSE stream: " + e.getMessage());
                endOfStream = true;
                return false;
            }
        }
    }
}

package com.elanco.ticktracker.exception;

import com.elanco.ticktracker.client.ElancoApiClient;

/** Signals an upstream Elanco request or response failure. */
public class ElancoApiException extends RuntimeException
{
    public ElancoApiException(String meesage, Throwable cause)
    {
        super(meesage, cause);
    }
}
